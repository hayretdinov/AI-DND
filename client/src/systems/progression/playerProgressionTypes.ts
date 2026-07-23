export type ProgressionRewardCategory =
  | "combat"
  | "quest"
  | "social"
  | "discovery"
  | "smithing"
  | "system";

export type ProgressionJournalEntry = {
  id: string;
  category: ProgressionRewardCategory;
  reason: string;
  sourceId?: string;
  experienceGained: number;
  levelBefore: number;
  levelAfter: number;
  skillPointsGained: number;
  createdAt: string;
};

export type PlayerProgressionState = {
  level: number;
  experience: number;
  skillPoints: number;
  processedRewardIds: string[];
  processedTransactionIds: string[];
  journal: ProgressionJournalEntry[];
};
