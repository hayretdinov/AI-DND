import type { GameSave } from "../save/saveSystem";
import type {
  PlayerProgressionState,
  ProgressionJournalEntry,
  ProgressionRewardCategory,
} from "./playerProgressionTypes";

export const LEVEL_UP_SKILL_POINTS = 1;
const MAX_PROGRESSION_HISTORY = 200;

export type ExperienceGrantResult = {
  save: GameSave;
  granted: boolean;
  duplicate: boolean;
  amount: number;
  levelsGained: number;
  skillPointsGained: number;
  levelBefore: number;
  levelAfter: number;
  experience: number;
  experienceRequired: number;
};

export type SkillPointSpendResult = {
  save: GameSave;
  success: boolean;
  duplicate: boolean;
  amount: number;
  reason: "ok" | "invalid_amount" | "not_enough_skill_points" | "duplicate_transaction";
};

function toNonNegativeInteger(value: unknown, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : fallback;
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)))
    : [];
}

function normalizeJournal(value: unknown): ProgressionJournalEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is ProgressionJournalEntry => {
      const candidate = entry as Partial<ProgressionJournalEntry>;
      return typeof candidate.id === "string" && typeof candidate.reason === "string";
    })
    .map((entry) => ({
      ...entry,
      experienceGained: toNonNegativeInteger(entry.experienceGained),
      levelBefore: Math.max(1, toNonNegativeInteger(entry.levelBefore, 1)),
      levelAfter: Math.max(1, toNonNegativeInteger(entry.levelAfter, 1)),
      skillPointsGained: toNonNegativeInteger(entry.skillPointsGained),
      createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date(0).toISOString(),
    }))
    .slice(-MAX_PROGRESSION_HISTORY);
}

export function createDefaultPlayerProgression(): PlayerProgressionState {
  return {
    level: 1,
    experience: 0,
    skillPoints: 0,
    processedRewardIds: [],
    processedTransactionIds: [],
    journal: [],
  };
}

export function normalizePlayerProgressionState(
  value?: Partial<PlayerProgressionState>,
  legacySkillPoints?: unknown,
): PlayerProgressionState {
  const fallback = createDefaultPlayerProgression();
  const normalizedLevel = Math.max(1, toNonNegativeInteger(value?.level, fallback.level));
  const migratedSkillPoints = value?.skillPoints ?? legacySkillPoints;

  return {
    level: normalizedLevel,
    experience: toNonNegativeInteger(value?.experience, fallback.experience),
    skillPoints: toNonNegativeInteger(migratedSkillPoints, fallback.skillPoints),
    processedRewardIds: normalizeStringList(value?.processedRewardIds).slice(-MAX_PROGRESSION_HISTORY),
    processedTransactionIds: normalizeStringList(value?.processedTransactionIds).slice(-MAX_PROGRESSION_HISTORY),
    journal: normalizeJournal(value?.journal),
  };
}

export function getExperienceRequiredForNextLevel(level: number) {
  const safeLevel = Math.max(1, toNonNegativeInteger(level, 1));

  return 100 + (safeLevel - 1) * 50;
}

export function getPlayerProgression(save: Pick<GameSave, "player">) {
  return normalizePlayerProgressionState(
    save.player.progression,
    save.player.trainerProgression?.skillPoints,
  );
}

export function getExperienceProgress(save: Pick<GameSave, "player">) {
  const progression = getPlayerProgression(save);
  const required = getExperienceRequiredForNextLevel(progression.level);

  return {
    ...progression,
    required,
    ratio: Math.min(1, Math.max(0, progression.experience / required)),
  };
}

export function addPlayerExperience(
  save: GameSave,
  amount: number,
  reason: string,
  sourceId?: string,
  category: ProgressionRewardCategory = "system",
): ExperienceGrantResult {
  const progression = getPlayerProgression(save);
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const duplicate = Boolean(sourceId && progression.processedRewardIds.includes(sourceId));
  const baseResult = {
    save,
    granted: false,
    duplicate,
    amount: 0,
    levelsGained: 0,
    skillPointsGained: 0,
    levelBefore: progression.level,
    levelAfter: progression.level,
    experience: progression.experience,
    experienceRequired: getExperienceRequiredForNextLevel(progression.level),
  };

  if (safeAmount <= 0 || duplicate) {
    return baseResult;
  }

  let level = progression.level;
  let experience = progression.experience + safeAmount;
  let levelsGained = 0;

  while (experience >= getExperienceRequiredForNextLevel(level)) {
    experience -= getExperienceRequiredForNextLevel(level);
    level += 1;
    levelsGained += 1;
  }

  const skillPointsGained = levelsGained * LEVEL_UP_SKILL_POINTS;
  const entry: ProgressionJournalEntry = {
    id: `progression_${Date.now()}_${progression.journal.length}`,
    category,
    reason,
    sourceId,
    experienceGained: safeAmount,
    levelBefore: progression.level,
    levelAfter: level,
    skillPointsGained,
    createdAt: new Date().toISOString(),
  };
  const nextProgression: PlayerProgressionState = {
    ...progression,
    level,
    experience,
    skillPoints: progression.skillPoints + skillPointsGained,
    processedRewardIds: sourceId
      ? [...progression.processedRewardIds, sourceId].slice(-MAX_PROGRESSION_HISTORY)
      : progression.processedRewardIds,
    journal: [...progression.journal, entry].slice(-MAX_PROGRESSION_HISTORY),
  };
  const nextSave: GameSave = {
    ...save,
    player: {
      ...save.player,
      progression: nextProgression,
      trainerProgression: save.player.trainerProgression
        ? { ...save.player.trainerProgression, skillPoints: undefined }
        : save.player.trainerProgression,
    },
  };

  console.info("[Progression] experience added", {
    amount: safeAmount,
    reason,
    sourceId,
    levelBefore: progression.level,
    levelAfter: level,
  });

  return {
    save: nextSave,
    granted: true,
    duplicate: false,
    amount: safeAmount,
    levelsGained,
    skillPointsGained,
    levelBefore: progression.level,
    levelAfter: level,
    experience,
    experienceRequired: getExperienceRequiredForNextLevel(level),
  };
}

export function spendPlayerSkillPoints(
  save: GameSave,
  amount: number,
  reason: string,
  transactionId: string,
): SkillPointSpendResult {
  const progression = getPlayerProgression(save);
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;

  if (safeAmount <= 0) {
    return { save, success: false, duplicate: false, amount: 0, reason: "invalid_amount" };
  }

  if (progression.processedTransactionIds.includes(transactionId)) {
    return { save, success: false, duplicate: true, amount: safeAmount, reason: "duplicate_transaction" };
  }

  if (progression.skillPoints < safeAmount) {
    return { save, success: false, duplicate: false, amount: safeAmount, reason: "not_enough_skill_points" };
  }

  const nextSave: GameSave = {
    ...save,
    player: {
      ...save.player,
      progression: {
        ...progression,
        skillPoints: progression.skillPoints - safeAmount,
        processedTransactionIds: [...progression.processedTransactionIds, transactionId].slice(-MAX_PROGRESSION_HISTORY),
      },
      trainerProgression: save.player.trainerProgression
        ? { ...save.player.trainerProgression, skillPoints: undefined }
        : save.player.trainerProgression,
    },
  };

  console.info("[Progression] skill points spent", { amount: safeAmount, reason, transactionId });

  return { save: nextSave, success: true, duplicate: false, amount: safeAmount, reason: "ok" };
}

export function grantPlayerSkillPoints(save: GameSave, amount: number, reason: string): GameSave {
  const progression = getPlayerProgression(save);
  const safeAmount = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;

  return {
    ...save,
    player: {
      ...save.player,
      progression: {
        ...progression,
        skillPoints: progression.skillPoints + safeAmount,
      },
      trainerProgression: save.player.trainerProgression
        ? { ...save.player.trainerProgression, skillPoints: undefined }
        : save.player.trainerProgression,
    },
  };
}
