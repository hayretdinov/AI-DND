export type SmithingStage = "heat" | "hammer" | "quench";

export type SmithingJobState = {
  stage: SmithingStage;
  progress: number;
  startedAt: string;
};

export type SmithingProgressionState = {
  hasBasicTraining: boolean;
  miniGameUnlocked: boolean;
  completedJobs: number;
  currentJob?: SmithingJobState;
  lastRewardItemId?: string;
  lastTrainedByNpcId?: string;
};
