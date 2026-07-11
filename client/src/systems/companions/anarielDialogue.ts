import { ANARIEL_SYSTEM_PROMPT } from "../../data/companions/anarielPrompt";
import { getWorldMapNodeById, isWorldMapNodeId } from "../../data/worldMap";
import type { TranslationKey } from "../../i18n/i18n";
import { requestLocalChatCompletion } from "../ai/localAiClient";
import type { AnarielCompanionState, GameSave } from "../save/saveSystem";
import type { CompanionDialogueMessage } from "../../types/companion";
import type { AiChatMessage } from "../../types/ai";

export const ANARIEL_FALLBACK_REPLY_KEYS = [
  "companion.chat.fallback.1",
  "companion.chat.fallback.2",
  "companion.chat.fallback.3",
  "companion.chat.fallback.4",
  "companion.chat.fallback.5",
] as const satisfies readonly TranslationKey[];

type ToneDelta = {
  relationship: number;
  trust: number;
  fear: number;
  respect: number;
};

const kindWords = [
  "спасибо",
  "помогу",
  "не бойся",
  "защищу",
  "ты в безопасности",
  "пойдем вместе",
  "thank",
  "help",
  "safe",
  "protect",
  "together",
];

const cruelWords = [
  "заткнись",
  "брось",
  "умри",
  "раб",
  "прикажу",
  "молчи",
  "shut up",
  "slave",
  "die",
  "obey",
  "silence",
];

const personalQuestions = [
  "кто ты",
  "что случилось",
  "расскажи",
  "тебя",
  "who are you",
  "what happened",
  "tell me",
  "about you",
];

function createDialogueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `dialogue-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function analyzePlayerTone(text: string): ToneDelta {
  const normalizedText = text.toLowerCase();
  const delta = {
    relationship: 0,
    trust: 0,
    fear: 0,
    respect: 0,
  };

  if (containsAny(normalizedText, kindWords)) {
    delta.trust += 2;
    delta.relationship += 2;
    delta.fear -= 1;
  }

  if (containsAny(normalizedText, cruelWords)) {
    delta.trust -= 3;
    delta.relationship -= 4;
    delta.fear += 3;
    delta.respect -= 1;
  }

  if (containsAny(normalizedText, personalQuestions)) {
    delta.trust += 1;
    delta.relationship += 1;
  }

  return delta;
}

export function applyAnarielToneDelta(
  state: AnarielCompanionState,
  delta: ToneDelta,
): AnarielCompanionState {
  return {
    ...state,
    relationship: clamp(state.relationship + delta.relationship),
    trust: clamp(state.trust + delta.trust),
    fear: clamp(state.fear + delta.fear),
    respect: clamp(state.respect + delta.respect),
  };
}

export function getFallbackReplyKey(historyLength: number): TranslationKey {
  return ANARIEL_FALLBACK_REPLY_KEYS[historyLength % ANARIEL_FALLBACK_REPLY_KEYS.length];
}

export function appendDialogueMessages(
  state: AnarielCompanionState,
  playerText: string,
  anarielText: string,
): AnarielCompanionState {
  const createdAt = new Date().toISOString();
  const playerMessage: CompanionDialogueMessage = {
    id: createDialogueId(),
    speaker: "player",
    text: playerText,
    createdAt,
  };
  const anarielMessage: CompanionDialogueMessage = {
    id: createDialogueId(),
    speaker: "anariel",
    text: anarielText,
    createdAt,
  };
  const nextMessages: CompanionDialogueMessage[] = [
    ...state.dialogueHistory,
    playerMessage,
    anarielMessage,
  ].slice(-20);

  return {
    ...state,
    dialogueHistory: nextMessages,
    lastDialogueSummary: nextMessages
      .slice(-4)
      .map((message) => `${message.speaker}: ${message.text}`)
      .join(" / "),
  };
}

export function buildAnarielAiMessages(save: GameSave, playerText: string): AiChatMessage[] {
  const anariel = save.companions?.anariel;
  const currentLocation = isWorldMapNodeId(save.currentLocationId)
    ? getWorldMapNodeById(save.currentLocationId)
    : null;
  const recentHistory = (anariel?.dialogueHistory ?? []).slice(-12);
  const stateSummary = [
    `Relationship: ${anariel?.relationship ?? 0}`,
    `Trust: ${anariel?.trust ?? 0}`,
    `Fear: ${anariel?.fear ?? 0}`,
    `Respect: ${anariel?.respect ?? 0}`,
    `Current location key: ${currentLocation?.titleKey ?? "unknown"}`,
    `Day: ${save.currentDay ?? "unknown"}`,
    `Hour: ${save.currentHour ?? "unknown"}`,
    `Player name: ${save.player.name}`,
    `Player origin: ${save.player.origin}`,
    `Player class: ${save.player.characterClass}`,
  ].join("\n");

  return [
    { role: "system", content: ANARIEL_SYSTEM_PROMPT },
    { role: "system", content: `Current game state:\n${stateSummary}` },
    ...recentHistory.map((message): AiChatMessage => ({
      role: message.speaker === "player" ? "user" : "assistant",
      content: message.text,
    })),
    { role: "user", content: playerText },
  ];
}

export async function getAnarielAiReply(save: GameSave, playerText: string) {
  return requestLocalChatCompletion(buildAnarielAiMessages(save, playerText));
}
