import type { ItemId } from "../../data/itemRegistry";

export type TrainingTier = "basic" | "intermediate" | "advanced" | "expert" | "master";
export type TrainerSpecialization = "meleeTrainer" | "bowTrainer" | "magicTrainer";
export type TrainingBranch = "melee" | "archery" | "magic";
export type TrainerAgreementStatus = "accepted" | "refused";

export type TrainingRequirement = {
  goldCost: number;
  skillPointCost: number;
  requiredPlayerLevel: number;
  prerequisiteSkillIds?: string[];
  prerequisiteTier?: TrainingTier;
};

export type TrainerAgreementState = {
  status: TrainerAgreementStatus;
  requestedAtGameMinute: number;
  acceptedAtGameMinute?: number;
  refusedAtGameMinute?: number;
  discipline?: TrainingBranch | "smithing";
};

export type TrainerProgressionState = {
  /** Legacy save field. Current skill points live in player.progression. */
  skillPoints?: number;
  spentSkillPoints: number;
  learnedTiers: Partial<Record<TrainingBranch, TrainingTier[]>>;
  freeBasicTrainerIds: string[];
  receivedGuideItemIds: string[];
  trainerAgreements: Record<string, TrainerAgreementState>;
};

export type TrainerDefinition = {
  id: string;
  specialization: TrainerSpecialization;
  branch: TrainingBranch;
  tiers: TrainingTier[];
  guideItemId: ItemId;
  freeBasic: boolean;
  basicRequiresService: boolean;
};
