import { createDefaultInventoryState } from "../../data/inventoryMockData";
import { getItemTemplateById, type ItemId } from "../../data/itemRegistry";
import type { InventoryItem } from "../../types/inventory";
import { addPlayerGold, type GameSave } from "../save/saveSystem";
import type { SmithingJobState, SmithingProgressionState, SmithingStage } from "./smithingTypes";

export const BLACKSMITH_DULTRAN_ID = "central_blacksmith_dultran";
export const BLACKSMITH_MINIGAME_REWARD = 25;

export const smithingStageGoals: Record<SmithingStage, number> = {
  heat: 3,
  hammer: 5,
  quench: 2,
};

const smithingStageOrder: SmithingStage[] = ["heat", "hammer", "quench"];
const smithingRewardCycle: ItemId[] = ["iron_mace", "simple_arrows", "iron_sword"];

export function createDefaultSmithingProgression(): SmithingProgressionState {
  return {
    hasBasicTraining: false,
    miniGameUnlocked: false,
    completedJobs: 0,
    rewardedAttemptIds: [],
  };
}

export function normalizeSmithingProgression(value: unknown): SmithingProgressionState {
  const fallback = createDefaultSmithingProgression();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const source = value as Partial<SmithingProgressionState>;
  const currentJob = normalizeSmithingJob(source.currentJob);

  return {
    hasBasicTraining: Boolean(source.hasBasicTraining),
    miniGameUnlocked: Boolean(source.miniGameUnlocked ?? source.hasBasicTraining),
    completedJobs: Number.isFinite(source.completedJobs) ? Math.max(0, Math.floor(Number(source.completedJobs))) : 0,
    currentJob,
    rewardedAttemptIds: Array.isArray(source.rewardedAttemptIds)
      ? Array.from(new Set(source.rewardedAttemptIds.filter((attemptId): attemptId is string => typeof attemptId === "string"))).slice(-50)
      : [],
    lastRewardItemId: typeof source.lastRewardItemId === "string" ? source.lastRewardItemId : undefined,
    lastRewardGold: Number.isFinite(source.lastRewardGold) ? Math.max(0, Math.floor(Number(source.lastRewardGold))) : undefined,
    lastTrainedByNpcId: typeof source.lastTrainedByNpcId === "string" ? source.lastTrainedByNpcId : undefined,
  };
}

function normalizeSmithingStage(value: unknown): SmithingStage {
  return value === "heat" || value === "hammer" || value === "quench" ? value : "heat";
}

function normalizeSmithingJob(value: unknown): SmithingJobState | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<SmithingJobState>;
  const stage = normalizeSmithingStage(source.stage);

  return {
    attemptId: typeof source.attemptId === "string" && source.attemptId
      ? source.attemptId
      : `legacy_smithing_${typeof source.startedAt === "string" ? source.startedAt : "unknown"}`,
    stage,
    progress: Number.isFinite(source.progress)
      ? Math.min(smithingStageGoals[stage], Math.max(0, Math.floor(Number(source.progress))))
      : 0,
    startedAt: typeof source.startedAt === "string" ? source.startedAt : new Date(0).toISOString(),
  };
}

function createSmithingRewardItem(itemId: ItemId, quantity: number): InventoryItem {
  const template = getItemTemplateById(itemId);

  if (!template) {
    throw new Error(`Unknown smithing reward: ${itemId}`);
  }

  const instanceId = `smithing_${itemId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

  return {
    ...template,
    id: instanceId,
    instanceId,
    itemId,
    quantity,
    condition: "intact",
    quality: template.defaultQuality ?? "common",
    origin: "smithing",
    owner: "player",
    createdAt: new Date().toISOString(),
  };
}

function addSmithingReward(save: GameSave, itemId: ItemId): GameSave {
  const inventory = save.inventory ?? createDefaultInventoryState();
  const quantity = itemId === "simple_arrows" ? 8 : 1;

  return {
    ...save,
    inventory: {
      ...inventory,
      items: [...inventory.items, createSmithingRewardItem(itemId, quantity)],
    },
  };
}

export function getSmithingProgression(save?: GameSave | null): SmithingProgressionState {
  return normalizeSmithingProgression(save?.player.smithing);
}

export function applyBlacksmithTraining(save: GameSave, npcId = BLACKSMITH_DULTRAN_ID) {
  const smithing = getSmithingProgression(save);

  if (smithing.hasBasicTraining) {
    return {
      ok: false,
      save,
      messageKey: "smithing.message.alreadyTrained",
    };
  }

  const nextSmithing: SmithingProgressionState = {
    ...smithing,
    hasBasicTraining: true,
    miniGameUnlocked: true,
    lastTrainedByNpcId: npcId,
  };

  return {
    ok: true,
    save: {
      ...save,
      player: {
        ...save.player,
        smithing: nextSmithing,
      },
    },
    messageKey: "smithing.message.trainingComplete",
  };
}

export function startSmithingJob(save: GameSave) {
  const smithing = getSmithingProgression(save);

  if (!smithing.miniGameUnlocked) {
    return { ok: false, save, messageKey: "smithing.message.locked" };
  }

  if (smithing.currentJob) {
    return { ok: true, save, messageKey: "smithing.message.jobAlreadyStarted" };
  }

  const currentJob: SmithingJobState = {
    attemptId: `smithing_attempt_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    stage: "heat",
    progress: 0,
    startedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    save: {
      ...save,
      player: {
        ...save.player,
        smithing: {
          ...smithing,
          currentJob,
        },
      },
    },
    messageKey: "smithing.message.jobStarted",
  };
}

export function applySmithingClick(save: GameSave) {
  const smithing = getSmithingProgression(save);

  if (!smithing.miniGameUnlocked) {
    return { ok: false, save, completed: false, messageKey: "smithing.message.locked" };
  }

  const job = smithing.currentJob;

  if (!job) {
    return { ok: false, save, completed: false, messageKey: "smithing.message.noActiveJob" };
  }
  const nextProgress = job.progress + 1;
  const goal = smithingStageGoals[job.stage];

  if (nextProgress < goal) {
    return {
      ok: true,
      completed: false,
      stage: job.stage,
      progress: nextProgress,
      goal,
      save: {
        ...save,
        player: {
          ...save.player,
          smithing: {
            ...smithing,
            currentJob: {
              ...job,
              progress: nextProgress,
            },
          },
        },
      },
      messageKey: "smithing.message.progress",
    };
  }

  const nextStage = smithingStageOrder[smithingStageOrder.indexOf(job.stage) + 1];

  if (nextStage) {
    const nextJob: SmithingJobState = {
      ...job,
      stage: nextStage,
      progress: 0,
    };

    return {
      ok: true,
      completed: false,
      stage: nextStage,
      progress: 0,
      goal: smithingStageGoals[nextStage],
      save: {
        ...save,
        player: {
          ...save.player,
          smithing: {
            ...smithing,
            currentJob: nextJob,
          },
        },
      },
      messageKey: `smithing.message.stage.${nextStage}`,
    };
  }

  if (smithing.rewardedAttemptIds.includes(job.attemptId)) {
    return {
      ok: false,
      completed: true,
      rewardGranted: false,
      attemptId: job.attemptId,
      save: {
        ...save,
        player: {
          ...save.player,
          smithing: {
            ...smithing,
            currentJob: undefined,
          },
        },
      },
      messageKey: "smithing.message.rewardAlreadyClaimed",
    };
  }

  const rewardItemId = smithingRewardCycle[smithing.completedJobs % smithingRewardCycle.length];
  const rewardedSave = addPlayerGold(
    addSmithingReward(save, rewardItemId),
    BLACKSMITH_MINIGAME_REWARD,
    `smithing_minigame_${job.attemptId}`,
  );

  return {
    ok: true,
    completed: true,
    rewardGranted: true,
    attemptId: job.attemptId,
    rewardItemId,
    rewardGold: BLACKSMITH_MINIGAME_REWARD,
    save: {
      ...rewardedSave,
      player: {
        ...rewardedSave.player,
        smithing: {
          ...smithing,
          currentJob: undefined,
          completedJobs: smithing.completedJobs + 1,
          rewardedAttemptIds: [...smithing.rewardedAttemptIds, job.attemptId].slice(-50),
          lastRewardItemId: rewardItemId,
          lastRewardGold: BLACKSMITH_MINIGAME_REWARD,
        },
      },
    },
    messageKey: "smithing.message.completed",
  };
}
