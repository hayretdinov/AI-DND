import { createDefaultInventoryState } from "../../data/inventoryMockData";
import { applyBlacksmithTraining, applySmithingClick, startSmithingJob } from "./smithingSystem";
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
  inventory: createDefaultInventoryState(),
};

const trained = applyBlacksmithTraining(baseSave);

if (!trained.ok || !trained.save.player.smithing?.miniGameUnlocked) {
  throw new Error("Blacksmith training should unlock the smithing mini-game.");
}

let workingSave = startSmithingJob(trained.save).save;

for (let index = 0; index < 10; index += 1) {
  workingSave = applySmithingClick(workingSave).save;
}

if (!workingSave.player.smithing?.completedJobs) {
  throw new Error("Smithing clicks should complete a job.");
}

if (!workingSave.inventory?.items.some((item) => item.origin === "smithing")) {
  throw new Error("Completing smithing should add a reward item.");
}
