import type { NpcDefinition, NpcSocialCheckOutcome } from "../../types/npc";
import type { GameSave } from "../save/saveSystem";
import {
  addPlayerExperience,
  type ExperienceGrantResult,
} from "./playerProgressionSystem";

export const QUEST_EXPERIENCE_FALLBACK = 25;
export const SOCIAL_CHECK_EXPERIENCE = 10;
export const BLACKSMITH_MINIGAME_EXPERIENCE = 5;
export const LOCATION_DISCOVERY_EXPERIENCE = 15;
export const MIN_COMBAT_EXPERIENCE = 1;

function unchangedExperienceResult(save: GameSave): ExperienceGrantResult {
  const progression = save.player.progression;
  const level = progression?.level ?? 1;
  const experience = progression?.experience ?? 0;

  return {
    save,
    granted: false,
    duplicate: false,
    amount: 0,
    levelsGained: 0,
    skillPointsGained: 0,
    levelBefore: level,
    levelAfter: level,
    experience,
    experienceRequired: 100 + (level - 1) * 50,
  };
}

export function grantCombatVictoryExperience(
  save: GameSave,
  combatId: string | undefined,
  npc: NpcDefinition | null | undefined,
  playerWon: boolean,
) {
  const configuredReward = Number(npc?.experienceReward);

  if (!playerWon || !combatId || !npc || !Number.isFinite(configuredReward) || configuredReward < MIN_COMBAT_EXPERIENCE) {
    return unchangedExperienceResult(save);
  }

  const reward = Math.max(MIN_COMBAT_EXPERIENCE, Math.floor(configuredReward));

  return addPlayerExperience(
    save,
    reward,
    `combat_victory:${npc.id}`,
    `combat:${combatId}`,
    "combat",
  );
}

export function grantQuestCompletionExperience(
  save: GameSave,
  questId: string,
  experienceReward = QUEST_EXPERIENCE_FALLBACK,
) {
  return addPlayerExperience(
    save,
    experienceReward,
    `quest_completed:${questId}`,
    `quest:${questId}`,
    "quest",
  );
}

export function grantLocationDiscoveryExperience(
  save: GameSave,
  locationId: string,
  experienceReward = LOCATION_DISCOVERY_EXPERIENCE,
) {
  return addPlayerExperience(
    save,
    experienceReward,
    `location_discovered:${locationId}`,
    `discovery:${locationId}`,
    "discovery",
  );
}

export function grantSocialCheckExperience(
  save: GameSave,
  sourceId: string,
  outcome: NpcSocialCheckOutcome,
) {
  if (outcome !== "success" && outcome !== "criticalSuccess") {
    return unchangedExperienceResult(save);
  }

  return addPlayerExperience(
    save,
    SOCIAL_CHECK_EXPERIENCE,
    `social_check:${sourceId}`,
    `social:${sourceId}`,
    "social",
  );
}
