import type { NpcRole } from "../../types/npc";

export type LoreKnowledgeLevel =
  | "common"
  | "local"
  | "professional"
  | "cultural"
  | "scholarly"
  | "secret"
  | "personal";

export type LoreCertainty = "FACT" | "WITNESSED" | "HEARD" | "BELIEF" | "RUMOR" | "SECRET" | "UNKNOWN" | "FORBIDDEN";

export type LoreEntry = {
  id: string;
  title: string;
  text: string;
  level: LoreKnowledgeLevel;
  certainty: LoreCertainty;
  tags: string[];
  allowedRoles?: NpcRole[];
  forbiddenForCommonNpc?: boolean;
};

export type NpcLearnedKnowledge = {
  id: string;
  text: string;
  certainty: Extract<LoreCertainty, "HEARD" | "RUMOR" | "WITNESSED">;
  learnedAt: string;
  source: "player" | "world_event";
};

export type NpcLoreProfile = {
  common: boolean;
  local: boolean;
  professionalTags: string[];
  culturalTags: string[];
  scholarly: boolean;
  secretAccess: boolean;
};

export type LoreContextBuildRequest = {
  npcRole: NpcRole;
  profession?: string;
  faction?: string;
  locationId?: string;
  playerText?: string;
  learnedKnowledge?: NpcLearnedKnowledge[];
};

export type LoreContext = {
  profile: NpcLoreProfile;
  entries: LoreEntry[];
  learnedKnowledge: NpcLearnedKnowledge[];
  promptText: string;
};
