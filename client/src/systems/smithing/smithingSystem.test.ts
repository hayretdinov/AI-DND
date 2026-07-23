import { createDefaultInventoryState } from "../../data/inventoryMockData";
import {
  applyBlacksmithTraining,
  applySmithingClick,
  BLACKSMITH_MINIGAME_REWARD,
  normalizeSmithingProgression,
  startSmithingJob,
} from "./smithingSystem";
import type { GameSave } from "../save/saveSystem";

const baseSave: GameSave = {
  player: {
    id: "player",
    name: "Tester",
    origin: "outcast",
    race: "human",
    gender: "male",
    characterClass: "warrior",
    appearance: "wanderer",
    currentOutfitStage: "rags",
    portraitUrl: "",
    attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    derivedStats: { health: 10, stamina: 10, armorClass: 10 },
    createdAt: new Date(0).toISOString(),
  },
  inventory: { ...createDefaultInventoryState(), gold: 100 },
};

const trained = applyBlacksmithTraining(baseSave);

if (!trained.ok || !trained.save.player.smithing?.miniGameUnlocked) {
  throw new Error("Blacksmith training should unlock the smithing mini-game.");
}

let workingSave = startSmithingJob(trained.save).save;
let finalClickSource = workingSave;

for (let index = 0; index < 10; index += 1) {
  finalClickSource = workingSave;
  workingSave = applySmithingClick(workingSave).save;
}

if (!workingSave.player.smithing?.completedJobs) {
  throw new Error("Smithing clicks should complete a job.");
}

if (!workingSave.inventory?.items.some((item) => item.origin === "smithing")) {
  throw new Error("Completing smithing should add a reward item.");
}

if (workingSave.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD) {
  throw new Error("Completing smithing should add exactly 25 gold.");
}

const repeatedFinalClick = applySmithingClick(finalClickSource);

if (repeatedFinalClick.save.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD) {
  throw new Error("Repeating the final callback must not stack the reward.");
}

const rewardedAttemptIds = workingSave.player.smithing?.rewardedAttemptIds ?? [];
const rewardedAttemptId = rewardedAttemptIds[rewardedAttemptIds.length - 1];
const restoredRewardedAttempt = applySmithingClick({
  ...workingSave,
  player: {
    ...workingSave.player,
    smithing: normalizeSmithingProgression({
      ...workingSave.player.smithing,
      currentJob: finalClickSource.player.smithing?.currentJob,
    }),
  },
});

if (
  !rewardedAttemptId
  || restoredRewardedAttempt.rewardGranted !== false
  || restoredRewardedAttempt.save.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD
) {
  throw new Error("A rewarded attempt restored from a save must remain claimed.");
}

const clickWithoutActiveJob = applySmithingClick(workingSave);

if (clickWithoutActiveJob.ok || clickWithoutActiveJob.save.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD) {
  throw new Error("A completed or closed job must not award gold again.");
}

workingSave = startSmithingJob(workingSave).save;

if (workingSave.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD) {
  throw new Error("Starting or leaving an attempt must not grant gold.");
}

for (let index = 0; index < 10; index += 1) {
  workingSave = applySmithingClick(workingSave).save;
}

if (workingSave.inventory?.gold !== 100 + BLACKSMITH_MINIGAME_REWARD * 2) {
  throw new Error("A new successful attempt should grant a new reward.");
}
