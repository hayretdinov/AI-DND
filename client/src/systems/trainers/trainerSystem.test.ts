import { createDefaultInventoryState } from "../../data/inventoryMockData";
import { trainerDefinitions } from "../../data/trainerNpcs";
import { createDefaultPlayerTraining } from "../../data/trainingData";
import type { GameSave } from "../save/saveSystem";
import { applyTrainerTraining, getTrainerStatus } from "./trainerSystem";

const mockSave = {
  player: {
    id: "trainer-test-player",
    name: "Trainer Test",
    origin: "hunter",
    race: "human",
    gender: "male",
    characterClass: "warrior",
    appearance: "wanderer",
    attributes: {
      strength: 12,
      dexterity: 12,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    derivedStats: {
      health: 10,
      stamina: 10,
      armorClass: 10,
    },
    training: createDefaultPlayerTraining(),
    createdAt: "2026-07-15T00:00:00.000Z",
  },
  inventory: {
    ...createDefaultInventoryState(),
    gold: 500,
  },
} as unknown as GameSave;

if (trainerDefinitions.arkel_magister.tiers.join(",") !== "basic") {
  throw new Error("Arkel should teach only basic magic.");
}

if (trainerDefinitions.general_vargas.tiers.includes("basic")) {
  throw new Error("General Vargas should not teach basic melee.");
}

if (trainerDefinitions.lord_commander_cedric.tiers.join(",") !== "master") {
  throw new Error("Lord Commander Cedric should teach only master melee.");
}

if (trainerDefinitions.archmage_tarvis.tiers.join(",") !== "intermediate,advanced") {
  throw new Error("Archmage Tarvis should teach intermediate and advanced magic.");
}

if (trainerDefinitions.high_mage_elyrion.tiers.join(",") !== "expert,master") {
  throw new Error("High Mage Elyrion should teach expert and master magic.");
}

const edgarBasic = applyTrainerTraining(mockSave, "edgar_swordmaster");

if (!edgarBasic.ok) {
  throw new Error("Edgar basic training should be free and available.");
}

if (!edgarBasic.save.player.training?.weapons.oneHandedSword || !edgarBasic.save.player.training.combat.basicAttack) {
  throw new Error("Edgar basic training should unlock sword basics and basic melee attacks.");
}

if (!edgarBasic.save.inventory?.items.some((item) => item.itemId === "melee_combat_beginner_guide")) {
  throw new Error("Edgar basic training should grant the melee beginner guide.");
}

const edgarIntermediateBlocked = applyTrainerTraining(edgarBasic.save, "edgar_swordmaster");

if (edgarIntermediateBlocked.ok || edgarIntermediateBlocked.messageKey !== "trainer.message.notEnoughSkillPoints") {
  throw new Error("Intermediate training should require skill points.");
}

const saveWithSkillPoints = {
  ...edgarBasic.save,
  player: {
    ...edgarBasic.save.player,
    trainerProgression: {
      ...edgarBasic.save.player.trainerProgression!,
      skillPoints: 3,
    },
  },
};
const edgarIntermediate = applyTrainerTraining(saveWithSkillPoints, "edgar_swordmaster");

if (!edgarIntermediate.ok) {
  throw new Error("Intermediate training should succeed when gold and skill points are available.");
}

if (edgarIntermediate.save.inventory?.gold !== 475) {
  throw new Error("Intermediate training should spend 25 gold.");
}

const arkelStatus = getTrainerStatus(mockSave, "arkel_magister");

if (arkelStatus.nextTier !== "basic") {
  throw new Error("Arkel should offer basic magic first.");
}
