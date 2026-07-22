export type SmithingStage = "heat" | "hammer" | "quench";

export type SmithingJobState = {
  attemptId: string;
  stage: SmithingStage;
  progress: number;
  startedAt: string;
};

export type SmithingProgressionState = {
  hasBasicTraining: boolean;
  miniGameUnlocked: boolean;
  completedJobs: number;
  currentJob?: SmithingJobState;
  rewardedAttemptIds: string[];
  lastRewardItemId?: string;
  lastRewardGold?: number;
  lastTrainedByNpcId?: string;
};
