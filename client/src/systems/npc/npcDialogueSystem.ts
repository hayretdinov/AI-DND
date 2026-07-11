import { buildNpcSystemPrompt } from "../../data/npcPrompts";
import { requestLocalChatCompletion } from "../ai/localAiClient";
import type { GameSave } from "../save/saveSystem";
import type { NpcDefinition, NpcDialogueMessage, NpcRuntimeState } from "../../types/npc";

const MAX_NPC_DIALOGUE_HISTORY = 20;

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

function createNpcDialogueMessage(speaker: NpcDialogueMessage["speaker"], text: string): NpcDialogueMessage {
  return {
    id: `${speaker}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speaker,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function appendNpcDialogueMessages(
  state: NpcRuntimeState,
  playerText: string,
  npcText: string,
): NpcRuntimeState {
  return {
    ...state,
    met: true,
    dialogueHistory: [
      ...state.dialogueHistory,
      createNpcDialogueMessage("player", playerText),
      createNpcDialogueMessage("npc", npcText),
    ].slice(-MAX_NPC_DIALOGUE_HISTORY),
  };
}

export function applyNpcToneDelta(state: NpcRuntimeState, playerText: string): NpcRuntimeState {
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

export function getNpcFallbackReplyKey(npc: NpcDefinition, historyLength: number) {
  if (npc.role === "guard") {
    return `npc.fallback.guard.${(historyLength % 4) + 1}`;
  }

  if (npc.role === "bandit") {
    return `npc.fallback.bandit.${(historyLength % 3) + 1}`;
  }

  return `npc.fallback.monster.${(historyLength % 2) + 1}`;
}

export async function getNpcAiReply(save: GameSave, npc: NpcDefinition, state: NpcRuntimeState, playerText: string) {
  if (!npc.canUseAiDialogue) {
    return { text: "", usedFallback: true, reason: "disabled" as const };
  }

  const messages = [
    { role: "system" as const, content: buildNpcSystemPrompt(npc, { save, state }) },
    ...state.dialogueHistory.slice(-10).map((message) => ({
      role: message.speaker === "player" ? ("user" as const) : ("assistant" as const),
      content: message.text,
    })),
    { role: "user" as const, content: playerText },
  ];

  return requestLocalChatCompletion(messages);
}
