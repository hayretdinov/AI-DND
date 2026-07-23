import type { NpcInstance } from "../../types/npc";
import type { GameSave } from "../save/saveSystem";
import { executePostCombatAction, getPostCombatActions } from "./postCombatSystem";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function createSave(origin: "hunter" | "outcast"): GameSave {
  return {
    player: {
      id: "player",
      name: "Test",
      origin,
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
  };
}

function createNpc(templateId: string, role: "monster" | "bandit"): NpcInstance {
  return {
    npcId: templateId,
    instanceId: `${templateId}_test`,
    templateId,
    role,
    status: "dead",
    createdAt: new Date(0).toISOString(),
    met: true,
    relationship: 0,
    trust: 0,
    fear: 0,
    hostility: 100,
    dialogueHistory: [],
  };
}

const serpent = createNpc("swamp_serpent", "monster");
const noSkillActions = getPostCombatActions(serpent, createSave("outcast"));
assert(noSkillActions.some((action) => action.id === "butcher" && action.requiresSkill), "Butchering must require a skill.");
assert(noSkillActions.some((action) => action.id === "skin" && action.disabled), "Skinning must be blocked without a skill.");

const hunterSave = createSave("hunter");
const hunterActions = getPostCombatActions(serpent, hunterSave);
assert(hunterActions.some((action) => action.id === "butcher" && !action.disabled), "A hunter must be able to butcher a serpent.");
assert(hunterActions.some((action) => action.id === "skin" && !action.disabled), "A hunter must be able to skin a serpent.");

const firstSkin = executePostCombatAction(hunterSave, serpent, "skin");
assert(firstSkin.completed && firstSkin.transferredItems.length > 0, "Skinning must grant configured resources.");
const savedSerpent = firstSkin.save.npcs?.instances[serpent.instanceId];
assert(savedSerpent?.loot?.completedBodyActions?.includes("skin") === true, "Completed body action must persist on the NPC.");
const secondSkin = executePostCombatAction(firstSkin.save, savedSerpent!, "skin");
assert(secondSkin.transferredItems.length === 0, "The same body action must not grant resources twice.");

const bandit = createNpc("road_bandit_01", "bandit");
assert(
  getPostCombatActions(bandit, hunterSave).every((action) => action.id === "loot"),
  "Sentient NPCs must never expose butcher or skin actions.",
);
