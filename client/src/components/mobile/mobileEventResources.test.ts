import type { PlayerCharacter } from "../../types/player";
import { getMobilePlayerResources } from "./mobileEventResources";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const player: PlayerCharacter = {
  id: "player",
  name: "Test",
  origin: "outcast",
  race: "human",
  gender: "male",
  characterClass: "warrior",
  appearance: "wanderer",
  currentOutfitStage: "rags",
  portraitUrl: "",
  attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  derivedStats: { health: 20, stamina: 12, armorClass: 10 },
  combat: { currentHealth: -5, maxHealth: 20, armorClass: 10, initiative: 0, attackBonus: 0, defenseBonus: 0 },
  textCombat: { maxStamina: 12, stamina: 30, stance: "balanced", distance: "melee", balance: 0, knownTechniques: [], detailedRolls: false, injuries: [] },
  createdAt: new Date(0).toISOString(),
};

const resources = getMobilePlayerResources(player);
const health = resources.find((resource) => resource.id === "health");
const mana = resources.find((resource) => resource.id === "mana");
const stamina = resources.find((resource) => resource.id === "stamina");

assert(health?.current === 0 && health.percent === 0, "Health must be clamped to zero.");
assert(mana?.max === 0 && mana.percent === 0, "A class without mana must render safely.");
assert(stamina?.current === 12 && stamina.percent === 100, "Stamina must not exceed its maximum.");
