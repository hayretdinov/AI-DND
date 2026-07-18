import { buildNpcSystemPrompt } from "../../data/npcPrompts";
import { getLanguage } from "../../i18n/i18n";
import { requestLocalChatCompletion } from "../ai/localAiClient";
import { sanitizeAiResponseForWorld } from "../ai/inWorldResponseSanitizer";
import { createNpcCombatState } from "../combat/combatSystem";
import { buildNpcKnowledgeContext, validateNpcWorldReferences } from "./npcKnowledgeSystem";
import { appEventBus } from "../events/eventBus";
import { loreResponseValidator } from "../lore/loreResponseValidator";
import type { GameSave } from "../save/saveSystem";
import type { WorldMapNodeId } from "../../data/worldMap";
import type { NpcDefinition, NpcDialogueMessage, NpcInstance, NpcRuntimeState, NpcStatus } from "../../types/npc";

const MAX_NPC_DIALOGUE_HISTORY = 20;
const MAX_LEARNED_KNOWLEDGE = 12;
const REWARD_GOLD_PATTERN = /\[\[REWARD_GOLD:(\d{1,3})\]\]/i;
const ALLOWED_REWARD_ROLES = new Set<NpcDefinition["role"]>(["guard", "merchant", "civilian"]);
const PLAYER_RUMOR_PATTERN = /говорят|слух|я слышал|я слышала|рассказывают|rumor|i heard|they say/i;

export function createInitialNpcState(npcId: string): NpcRuntimeState {
  return {
    npcId,
    met: false,
    relationship: 0,
    trust: 0,
    fear: 0,
    hostility: 0,
    dialogueHistory: [],
  };
}

function createNpcInstanceId(templateId: string) {
  const templatePrefix = templateId.replace(/_0\d+$/, "");

  return `${templatePrefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function createNpcInstance(
  template: NpcDefinition,
  options: {
    eventId?: string;
    routeFromId?: WorldMapNodeId;
    routeToId?: WorldMapNodeId;
    instanceId?: string;
  } = {},
): NpcInstance {
  const instanceId = options.instanceId ?? createNpcInstanceId(template.id);
  const instance: NpcInstance = {
    ...createInitialNpcState(instanceId),
    instanceId,
    templateId: template.id,
    role: template.role,
    status: "alive",
    combat: createNpcCombatState(template.id, template.role),
    createdAt: new Date().toISOString(),
    createdDuringEventId: options.eventId,
    createdOnRoute: options.routeFromId && options.routeToId
      ? { fromId: options.routeFromId, toId: options.routeToId }
      : undefined,
  };

  console.info("[NPC] Created instance", {
    instanceId: instance.instanceId,
    templateId: instance.templateId,
    eventId: options.eventId,
  });

  return instance;
}

export function createPersistentNpcInstance(template: NpcDefinition, instanceId = template.id): NpcInstance {
  return createNpcInstance(template, { instanceId });
}

export function setNpcInstanceStatus(instance: NpcInstance, status: NpcStatus): NpcInstance {
  return {
    ...instance,
    status,
  };
}

export function markNpcInstanceDead(instance: NpcInstance): NpcInstance {
  const nextInstance = {
    ...setNpcInstanceStatus(instance, "dead"),
    combat: instance.combat
      ? {
          ...instance.combat,
          currentHealth: 0,
          isDefeated: true,
        }
      : instance.combat,
  };

  console.info("[NPC] Marked dead", {
    instanceId: nextInstance.instanceId,
    templateId: nextInstance.templateId,
  });

  return nextInstance;
}

function createNpcDialogueMessage(speaker: NpcDialogueMessage["speaker"], text: string): NpcDialogueMessage {
  return {
    id: `${speaker}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speaker,
    text,
    createdAt: new Date().toISOString(),
  };
}

function appendLearnedRumor<T extends NpcRuntimeState>(state: T, playerText: string): T {
  if (!PLAYER_RUMOR_PATTERN.test(playerText)) {
    return state;
  }

  const learnedEntry = {
    id: `rumor-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: playerText.slice(0, 240),
    certainty: "RUMOR" as const,
    learnedAt: new Date().toISOString(),
    source: "player" as const,
  };

  appEventBus.emit("NPC_RUMOR_LEARNED", {
    npcId: state.npcId,
    knowledgeId: learnedEntry.id,
  });

  appEventBus.emit("NPC_KNOWLEDGE_LEARNED", {
    npcId: state.npcId,
    certainty: learnedEntry.certainty,
  });

  return {
    ...state,
    learnedKnowledge: [...(state.learnedKnowledge ?? []), learnedEntry].slice(-MAX_LEARNED_KNOWLEDGE),
  };
}

export function appendNpcDialogueMessages<T extends NpcRuntimeState>(
  state: T,
  playerText: string,
  npcText: string,
): T {
  const stateWithLearnedRumor = appendLearnedRumor(state, playerText);

  return {
    ...stateWithLearnedRumor,
    met: true,
    dialogueHistory: [
      ...stateWithLearnedRumor.dialogueHistory,
      createNpcDialogueMessage("player", playerText),
      createNpcDialogueMessage("npc", npcText),
    ].slice(-MAX_NPC_DIALOGUE_HISTORY),
  };
}

export function appendNpcGameMasterMessages<T extends NpcRuntimeState>(
  state: T,
  playerText: string,
  narrationText: string,
): T {
  return {
    ...state,
    met: true,
    dialogueHistory: [
      ...state.dialogueHistory,
      createNpcDialogueMessage("player", playerText),
      createNpcDialogueMessage("game_master", narrationText),
    ].slice(-MAX_NPC_DIALOGUE_HISTORY),
  };
}

export function applyNpcToneDelta<T extends NpcRuntimeState>(state: T, playerText: string): T {
  const lowered = playerText.toLowerCase();
  const isThreat = /угрож|убью|kill|threat|attack|нож|sword/.test(lowered);
  const isKind = /пожалуйста|спасибо|please|help|мир|peace/.test(lowered);

  return {
    ...state,
    relationship: Math.max(-100, Math.min(100, state.relationship + (isKind ? 3 : 0) - (isThreat ? 4 : 0))),
    trust: Math.max(0, Math.min(100, state.trust + (isKind ? 2 : 0))),
    fear: Math.max(0, Math.min(100, state.fear + (isThreat ? 5 : 0))),
    hostility: Math.max(0, Math.min(100, state.hostility + (isThreat ? 6 : 0) - (isKind ? 1 : 0))),
  };
}

export function extractNpcGoldReward(text: string, npc: NpcDefinition) {
  const marker = text.match(REWARD_GOLD_PATTERN);
  const cleanText = text.replace(REWARD_GOLD_PATTERN, "").trim();

  if (!marker || !ALLOWED_REWARD_ROLES.has(npc.role)) {
    return { text: cleanText, rewardGold: 0 };
  }

  const amount = Number(marker[1]);
  const rewardGold = Number.isFinite(amount) && amount >= 1 && amount <= 50 ? Math.floor(amount) : 0;

  return { text: cleanText, rewardGold };
}

export function getNpcFallbackReplyKey(npc: NpcDefinition, historyLength: number) {
  if (npc.role === "guard") {
    return `npc.fallback.guard.${(historyLength % 4) + 1}`;
  }

  if (npc.role === "bandit") {
    return `npc.fallback.bandit.${(historyLength % 3) + 1}`;
  }

  if (npc.role === "merchant") {
    return `npc.fallback.merchant.${(historyLength % 3) + 1}`;
  }

  if (npc.role === "blacksmith") {
    return `npc.fallback.blacksmith.${(historyLength % 3) + 1}`;
  }

  if (npc.role === "ruler" || npc.role === "noble" || npc.role === "mage" || npc.role === "priest" || npc.role === "military" || npc.role === "scholar") {
    return `npc.fallback.royalCourt.${(historyLength % 4) + 1}`;
  }

  return `npc.fallback.monster.${(historyLength % 2) + 1}`;
}

export async function getNpcAiReply(save: GameSave, npc: NpcDefinition, state: NpcRuntimeState, playerText: string) {
  if (!npc.canUseAiDialogue) {
    return { text: "", usedFallback: true, reason: "disabled" as const };
  }

  const messages = [
    { role: "system" as const, content: buildNpcSystemPrompt(npc, { save, state, playerText }) },
    ...state.dialogueHistory.slice(-10).map((message) => ({
      role: message.speaker === "player" ? ("user" as const) : ("assistant" as const),
      content: message.text,
    })),
    { role: "user" as const, content: playerText },
  ];

  const reply = await requestLocalChatCompletion(messages);

  if (reply.usedFallback) {
    return reply;
  }

  const validation = validateNpcWorldReferences(
    reply.text,
    buildNpcKnowledgeContext(npc, { save, state }),
  );
  const loreValidation = loreResponseValidator.validate(validation.cleanText || reply.text, getLanguage());
  const sanitizedReply = sanitizeAiResponseForWorld({
    text: loreValidation.cleanText,
    speakerId: npc.id,
    speakerRole: npc.role,
    language: getLanguage(),
    context: state.npcId,
  });
  appEventBus.emit("NPC_DIALOGUE_GENERATED", {
    npcId: npc.id,
    usedFallback: reply.usedFallback,
    loreViolations: loreValidation.violations.length,
  });

  return {
    ...reply,
    text: sanitizedReply.cleanText,
  };
}
