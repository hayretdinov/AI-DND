import type { TranslationKey } from "../i18n/i18n";
import type { WorldMapNodeId } from "../data/worldMap";

export type NpcRole = "guard" | "bandit" | "monster" | "merchant" | "civilian" | "companion";
export type NpcMood = "neutral" | "hostile" | "afraid" | "friendly";

export type NpcDialogueMessage = {
  id: string;
  speaker: "player" | "npc";
  text: string;
  createdAt: string;
};

export type NpcDefinition = {
  id: string;
  nameKey: TranslationKey;
  role: NpcRole;
  locationId?: WorldMapNodeId;
  faction?: string;
  imageUrl?: string;
  portraitUrl?: string;
  systemPrompt?: string;
  greetingKey: TranslationKey;
  defaultMood: NpcMood;
  canUseAiDialogue: boolean;
};

export type NpcRuntimeState = {
  npcId: string;
  met: boolean;
  relationship: number;
  trust: number;
  fear: number;
  hostility: number;
  dialogueHistory: NpcDialogueMessage[];
};
