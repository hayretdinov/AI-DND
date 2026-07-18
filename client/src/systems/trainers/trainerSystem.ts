import { trainerDefinitions, getTrainerDefinition } from "../../data/trainerNpcs";
import { addUniqueInventoryItem } from "../inventory/readableItems";
import { createDefaultMagicState, learnMagicWord, learnSpellFormula } from "../magic";
import { spendPlayerGold, type GameSave } from "../save/saveSystem";
import type { PlayerTraining } from "../../types/combat";
import { createDefaultPlayerTraining } from "../../data/trainingData";
import type { MagicMasteryLevel } from "../magic/magicTypes";
import type { TrainerAgreementState, TrainerProgressionState, TrainingBranch, TrainingTier } from "./trainerTypes";

const TIER_ORDER: TrainingTier[] = ["basic", "intermediate", "advanced", "expert", "master"];

const TIER_COSTS: Record<TrainingTier, { gold: number; skillPoints: number }> = {
  basic: { gold: 0, skillPoints: 0 },
  intermediate: { gold: 25, skillPoints: 1 },
  advanced: { gold: 60, skillPoints: 2 },
  expert: { gold: 120, skillPoints: 3 },
  master: { gold: 250, skillPoints: 5 },
};

export function createDefaultTrainerProgression(): TrainerProgressionState {
  return {
    skillPoints: 0,
    spentSkillPoints: 0,
    learnedTiers: {},
    freeBasicTrainerIds: [],
    receivedGuideItemIds: [],
    trainerAgreements: {},
  };
}

export function normalizeTrainerProgression(value?: Partial<TrainerProgressionState>): TrainerProgressionState {
  const fallback = createDefaultTrainerProgression();
  const learnedTiers = (value?.learnedTiers ?? {}) as Partial<Record<TrainingBranch, TrainingTier[]>>;
  const rawAgreements = value?.trainerAgreements && typeof value.trainerAgreements === "object"
    ? value.trainerAgreements
    : {};

  return {
    skillPoints: Number.isFinite(value?.skillPoints) ? Math.max(0, Math.floor(Number(value?.skillPoints))) : fallback.skillPoints,
    spentSkillPoints: Number.isFinite(value?.spentSkillPoints) ? Math.max(0, Math.floor(Number(value?.spentSkillPoints))) : fallback.spentSkillPoints,
    learnedTiers: {
      melee: normalizeTierList(learnedTiers.melee),
      archery: normalizeTierList(learnedTiers.archery),
      magic: normalizeTierList(learnedTiers.magic),
    },
    freeBasicTrainerIds: Array.isArray(value?.freeBasicTrainerIds)
      ? Array.from(new Set(value.freeBasicTrainerIds.filter((id): id is string => typeof id === "string")))
      : [],
    receivedGuideItemIds: Array.isArray(value?.receivedGuideItemIds)
      ? Array.from(new Set(value.receivedGuideItemIds.filter((id): id is string => typeof id === "string")))
      : [],
    trainerAgreements: Object.fromEntries(
      Object.entries(rawAgreements)
        .filter((entry): entry is [string, TrainerAgreementState] => {
          const agreement = entry[1] as Partial<TrainerAgreementState>;
          return (
            typeof entry[0] === "string" &&
            (agreement.status === "accepted" || agreement.status === "refused")
          );
        })
        .map(([trainerId, agreement]) => [
          trainerId,
          {
            status: agreement.status,
            requestedAtGameMinute: Number.isFinite(agreement.requestedAtGameMinute)
              ? Math.max(0, Math.floor(Number(agreement.requestedAtGameMinute)))
              : 0,
            acceptedAtGameMinute: Number.isFinite(agreement.acceptedAtGameMinute)
              ? Math.max(0, Math.floor(Number(agreement.acceptedAtGameMinute)))
              : undefined,
            refusedAtGameMinute: Number.isFinite(agreement.refusedAtGameMinute)
              ? Math.max(0, Math.floor(Number(agreement.refusedAtGameMinute)))
              : undefined,
            discipline:
              agreement.discipline === "melee" ||
              agreement.discipline === "archery" ||
              agreement.discipline === "magic" ||
              agreement.discipline === "smithing"
                ? agreement.discipline
                : undefined,
          },
        ]),
    ),
  };
}

function normalizeTierList(value: unknown): TrainingTier[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((tier): tier is TrainingTier => TIER_ORDER.includes(tier as TrainingTier))))
    : [];
}

function getNextTier(branch: TrainingBranch, learnedTiers: TrainingTier[], offeredTiers: TrainingTier[]) {
  for (const tier of TIER_ORDER) {
    if (!offeredTiers.includes(tier) || learnedTiers.includes(tier)) {
      continue;
    }

    if (tier === "basic" || learnedTiers.includes(TIER_ORDER[TIER_ORDER.indexOf(tier) - 1])) {
      return tier;
    }

    if (branch !== "magic") {
      return undefined;
    }
  }

  return undefined;
}

function applyTrainingBranch(training: PlayerTraining, branch: TrainingBranch, tier: TrainingTier): PlayerTraining {
  if (branch === "melee") {
    return {
      ...training,
      weapons: {
        ...training.weapons,
        oneHandedSword: true,
        dagger: true,
        ...(tier !== "basic" ? { twoHandedSword: true, axe: true, mace: true } : {}),
      },
      combat: {
        ...training.combat,
        basicAttack: true,
        aimedAttack: tier !== "basic" || training.combat.aimedAttack,
        powerAttack: tier === "advanced" || tier === "expert" || tier === "master" || training.combat.powerAttack,
        parry: tier !== "basic" || training.combat.parry,
        dodge: true,
      },
    };
  }

  if (branch === "archery") {
    return {
      ...training,
      weapons: {
        ...training.weapons,
        bow: true,
        shortBow: true,
        ...(tier !== "basic" ? { longBow: true, handCrossbow: true, lightCrossbow: true } : {}),
      },
    };
  }

  return training;
}

function applyMagicTraining(save: GameSave, tier: TrainingTier, trainerId: string): GameSave {
  const baseMagic = save.player.magic ?? createDefaultMagicState(save.player.characterClass);
  const basicWords = ["ignis", "manus", "minora", "lancea", "hostis", "sphere"];
  const intermediateWords = ["scutum", "aura", "vitar", "sano"];
  const advancedWords = ["voltar", "catena", "magna"];
  const expertWords = ["arcanum", "granda", "porta"];
  const masterWords = ["archona", "ultima"];
  const wordIds =
    tier === "basic" ? basicWords :
    tier === "intermediate" ? intermediateWords :
    tier === "advanced" ? advancedWords :
    tier === "expert" ? expertWords :
    masterWords;
  const masteryLevel: MagicMasteryLevel = tier === "basic" ? "understood" : tier === "master" ? "comprehended" : "mastered";
  const trainedMagic = wordIds.reduce(
    (magic, wordId) => learnMagicWord(magic, wordId, masteryLevel, trainerId),
    {
      ...baseMagic,
      canUseMagic: true,
      grimoireUnlocked: true,
      magicLevel: Math.max(baseMagic.magicLevel, TIER_ORDER.indexOf(tier) + 1),
      maxMana: Math.max(baseMagic.maxMana, 20),
      mana: Math.max(baseMagic.mana, Math.min(Math.max(baseMagic.maxMana, 20), 20)),
      manaRegeneration: Math.max(baseMagic.manaRegeneration, 2),
    },
  );
  const nextMagic = tier === "basic"
    ? learnSpellFormula(trainedMagic, "fire_lance", ["ignis", "lancea", "hostis"], trainerId)
    : trainedMagic;

  return {
    ...save,
    player: {
      ...save.player,
      magic: nextMagic,
    },
  };
}

export function getTrainerStatus(save: GameSave | null | undefined, trainerId: string) {
  const trainer = getTrainerDefinition(trainerId);

  if (!save || !trainer) {
    return { trainer, nextTier: undefined, learnedTiers: [] as TrainingTier[], cost: undefined };
  }

  const progression = normalizeTrainerProgression(save.player.trainerProgression);
  const learnedTiers = progression.learnedTiers[trainer.branch] ?? [];
  const nextTier = getNextTier(trainer.branch, learnedTiers, trainer.tiers);

  return {
    trainer,
    nextTier,
    learnedTiers,
    cost: nextTier ? TIER_COSTS[nextTier] : undefined,
  };
}

export function applyTrainerTraining(save: GameSave, trainerId: string) {
  const status = getTrainerStatus(save, trainerId);
  const trainer = status.trainer;
  const tier = status.nextTier;

  if (!trainer || !tier || !status.cost) {
    return { ok: false as const, save, messageKey: "trainer.message.noTrainingAvailable", tier: undefined };
  }

  const progression = normalizeTrainerProgression(save.player.trainerProgression);
  const isFreeBasic = tier === "basic" && trainer.freeBasic && !progression.freeBasicTrainerIds.includes(trainerId);
  const cost = isFreeBasic ? { gold: 0, skillPoints: 0 } : status.cost;

  if (progression.skillPoints < cost.skillPoints) {
    return { ok: false as const, save, messageKey: "trainer.message.notEnoughSkillPoints", tier };
  }

  const goldResult = cost.gold > 0 ? spendPlayerGold(save, cost.gold, `trainer_${trainerId}_${tier}`) : { save, success: true };

  if (!goldResult.success) {
    return { ok: false as const, save, messageKey: "trainer.message.notEnoughGold", tier };
  }

  const paidSave = goldResult.save;
  const currentTraining = paidSave.player.training ?? createDefaultPlayerTraining();
  const trainedSave = trainer.branch === "magic"
    ? applyMagicTraining(paidSave, tier, trainerId)
    : {
        ...paidSave,
        player: {
          ...paidSave.player,
          training: applyTrainingBranch(currentTraining, trainer.branch, tier),
        },
      };
  const learnedForBranch = progression.learnedTiers[trainer.branch] ?? [];
  const nextProgression: TrainerProgressionState = {
    ...progression,
    skillPoints: Math.max(0, progression.skillPoints - cost.skillPoints),
    spentSkillPoints: progression.spentSkillPoints + cost.skillPoints,
    learnedTiers: {
      ...progression.learnedTiers,
      [trainer.branch]: Array.from(new Set([...learnedForBranch, tier])),
    },
    freeBasicTrainerIds: isFreeBasic ? Array.from(new Set([...progression.freeBasicTrainerIds, trainerId])) : progression.freeBasicTrainerIds,
    receivedGuideItemIds: Array.from(new Set([...progression.receivedGuideItemIds, trainer.guideItemId])),
  };
  const withProgression: GameSave = {
    ...trainedSave,
    player: {
      ...trainedSave.player,
      trainerProgression: nextProgression,
    },
  };
  const withGuide = addUniqueInventoryItem(withProgression, trainer.guideItemId, `trainer_${trainerId}`);

  return {
    ok: true as const,
    save: withGuide,
    messageKey: isFreeBasic ? "trainer.message.basicCompletedFree" : "trainer.message.trainingCompleted",
    tier,
    cost,
  };
}

function getGameMinute(save: GameSave) {
  const day = Number.isFinite(save.currentDay) ? Math.max(1, Math.floor(Number(save.currentDay))) : 1;
  const hour = Number.isFinite(save.currentHour) ? Math.max(0, Math.floor(Number(save.currentHour))) : 6;

  return ((day - 1) * 24 + Math.min(23, hour)) * 60;
}

export function getTrainerAgreement(save: GameSave | null | undefined, trainerId: string) {
  const progression = normalizeTrainerProgression(save?.player.trainerProgression);

  return progression.trainerAgreements[trainerId];
}

export function hasAcceptedTrainerAgreement(save: GameSave | null | undefined, trainerId: string) {
  return getTrainerAgreement(save, trainerId)?.status === "accepted";
}

export function acceptTrainerAgreement(
  save: GameSave,
  trainerId: string,
  discipline: TrainingBranch | "smithing",
): GameSave {
  const progression = normalizeTrainerProgression(save.player.trainerProgression);
  const gameMinute = getGameMinute(save);

  return {
    ...save,
    player: {
      ...save.player,
      trainerProgression: {
        ...progression,
        trainerAgreements: {
          ...progression.trainerAgreements,
          [trainerId]: {
            status: "accepted",
            discipline,
            requestedAtGameMinute: progression.trainerAgreements[trainerId]?.requestedAtGameMinute ?? gameMinute,
            acceptedAtGameMinute: gameMinute,
          },
        },
      },
    },
  };
}

export function refuseTrainerAgreement(
  save: GameSave,
  trainerId: string,
  discipline?: TrainingBranch | "smithing",
): GameSave {
  const progression = normalizeTrainerProgression(save.player.trainerProgression);
  const gameMinute = getGameMinute(save);

  return {
    ...save,
    player: {
      ...save.player,
      trainerProgression: {
        ...progression,
        trainerAgreements: {
          ...progression.trainerAgreements,
          [trainerId]: {
            status: "refused",
            discipline,
            requestedAtGameMinute: gameMinute,
            refusedAtGameMinute: gameMinute,
          },
        },
      },
    },
  };
}

export function getAllTrainerDefinitions() {
  return trainerDefinitions;
}
