import type { TranslationKey } from "../i18n/i18n";
import type { WorldMapNodeId } from "../data/worldMap";
import type { NpcCombatState } from "./combat";
import type { NpcTextCombatState } from "../systems/combat/text/combatTextTypes";
import type { InventoryItem } from "./inventory";
import type { NpcLearnedKnowledge } from "../systems/lore/loreTypes";

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
  | "blacksmith"
  | "trainer";
export type NpcMood = "neutral" | "hostile" | "afraid" | "friendly";
export type NpcStatus =
  | "alive"
  | "defeated"
  | "unconscious"
  | "surrendered"
  | "dead"
  | "escaped"
  | "gone"
  | "missing"
  | "imprisoned"
  | "exiled";

export type NpcDialogueMessage = {
  id: string;
  speaker: "player" | "npc" | "game_master" | "combat" | "system";
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
  lastSocialCheck?: NpcSocialCheckMemory;
  dialogueHistory: NpcDialogueMessage[];
  learnedKnowledge?: NpcLearnedKnowledge[];
  postCombatMemory?: NpcPostCombatMemory;
  loot?: NpcLootState;
};

export type NpcSocialCheckType = "persuasion" | "deception" | "intimidation" | "insight" | "knowledge";
export type NpcSocialCheckOutcome = "criticalFailure" | "failure" | "partialSuccess" | "success" | "criticalSuccess";

export type NpcSocialCheckMemory = {
  type: NpcSocialCheckType;
  outcome: NpcSocialCheckOutcome;
  playerText: string;
  resolvedAt: string;
};

export type NpcPostCombatMemory = {
  lastOutcome?: "playerDefeated" | "npcDefeatedAlive" | "enemyDead" | "monsterDefeated";
  defeatedBy?: string;
  defeatedPlayer?: boolean;
  wasSpared?: boolean;
  wasExecuted?: boolean;
  wasLooted?: boolean;
  demandedItemIds?: string[];
  surrenderedItemIds?: string[];
  updatedAt?: string;
};

export type NpcLootState = {
  generated: boolean;
  searched: boolean;
  items: InventoryItem[];
  gold: number;
  generatedAt?: string;
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
  textCombat?: NpcTextCombatState;
};
