import type { GameSave } from "../save/saveSystem";
import type { NpcInstance } from "../../types/npc";
import { resolveSocialCheck } from "./socialCheckSystem";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const npc: NpcInstance = {
  npcId: "guard", instanceId: "guard", templateId: "guard", role: "guard", status: "alive",
  createdAt: new Date(0).toISOString(), met: true, relationship: 0, trust: 0, fear: 0, hostility: 0,
  dialogueHistory: [],
};
function createSave(charisma: number): GameSave {
  return { player: {
    id: "player", name: "Test", origin: "outcast", race: "human", gender: "male", characterClass: "rogue",
    appearance: "wanderer", currentOutfitStage: "rags", portraitUrl: "",
    attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma },
    derivedStats: { health: 10, stamina: 10, armorClass: 10 }, createdAt: new Date(0).toISOString(),
  } };
}
const weak = resolveSocialCheck(createSave(6), npc, "persuasion", "Let me pass", { roll: 10 });
const strong = resolveSocialCheck(createSave(18), npc, "persuasion", "Let me pass", { roll: 10 });
assert(weak.result.outcome === "failure", "Low charisma must be able to fail a fixed social check.");
assert(strong.result.outcome !== "failure" && strong.result.outcome !== "criticalFailure", "High charisma must improve the same fixed social check.");
assert(strong.npc.lastSocialCheck?.outcome === strong.result.outcome, "NPC memory must store the structured outcome.");
const friendly = resolveSocialCheck(createSave(10), { ...npc, relationship: 60, trust: 50 }, "persuasion", "Let me pass", { roll: 9 });
const hostile = resolveSocialCheck(createSave(10), { ...npc, hostility: 80, trust: -20 }, "persuasion", "Let me pass", { roll: 9 });
assert(friendly.result.outcome !== hostile.result.outcome, "Relationship, trust and hostility must change the outcome.");
const fearful = resolveSocialCheck(createSave(10), { ...npc, fear: 80 }, "intimidation", "I will hurt you", { roll: 8 });
const fearless = resolveSocialCheck(createSave(10), npc, "intimidation", "I will hurt you", { roll: 8 });
assert(fearful.result.outcome !== fearless.result.outcome, "Fear must affect intimidation difficulty.");
const physical = resolveSocialCheck({ ...createSave(8), player: { ...createSave(8).player, attributes: { ...createSave(8).player.attributes, strength: 18 } } }, npc, "intimidation", "I break a board with raw strength", { roll: 10 });
assert(physical.result.relevantStat === "strength", "Physical intimidation must be able to use Strength.");
const dead = resolveSocialCheck(createSave(18), { ...npc, status: "dead" }, "persuasion", "Listen", { roll: 20 });
assert(dead.result.blockedReason === "deadTarget" && dead.npc.lastSocialCheck === undefined, "Dead NPCs must not resolve social checks.");
const monster = resolveSocialCheck(createSave(18), { ...npc, role: "monster" }, "persuasion", "Listen", { roll: 20 });
assert(monster.result.blockedReason === "nonSapientTarget", "Non-sapient monsters must not resolve human social checks.");
