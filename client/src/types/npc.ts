import type { TranslationKey } from "../i18n/i18n";
import type { WorldMapNodeId } from "../data/worldMap";
import type { NpcCombatState } from "./combat";

export type NpcRole =
  | "guard"
  | "bandit"
  | "monster"
  | "merchant"
  | "civilian"
  | "companion"
  | "ruler"
  | "mage"
  | "priest"
  | "military"
  | "noble"
  | "scholar"
  | "blacksmith";
export type NpcMood = "neutral" | "hostile" | "afraid" | "friendly";
export type NpcStatus = "alive" | "dead" | "escaped" | "gone" | "missing" | "imprisoned" | "exiled";

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
  titleKey?: TranslationKey;
  profession?: string;
  socialStatus?: string;
  stableInstanceId?: string;
  interiorLocationId?: string;
  persistent?: boolean;
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

export type NpcInstance = NpcRuntimeState & {
  instanceId: string;
  templateId: string;
  role: NpcRole;
  status: NpcStatus;
  createdAt: string;
  createdDuringEventId?: string;
  createdOnRoute?: {
    fromId: WorldMapNodeId;
    toId: WorldMapNodeId;
  };
  combat?: NpcCombatState;
};
