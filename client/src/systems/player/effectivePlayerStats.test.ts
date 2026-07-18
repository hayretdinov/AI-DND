import type { InventoryState } from "../../types/inventory";
import type { PlayerCharacter } from "../../types/player";
import { resolveEffectivePlayerStats } from "./effectivePlayerStats";
import { createPlayerCombatStats } from "./playerProgressionSystem";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const player: PlayerCharacter = {
  id: "effective-stats-player",
  name: "Test",
  origin: "hunter",
  race: "orc",
  gender: "male",
  characterClass: "warrior",
  appearance: "wanderer",
  currentOutfitStage: "armor",
  portraitUrl: "",
  attributes: { strength: 13, dexterity: 12, constitution: 12, intelligence: 9, wisdom: 10, charisma: 8 },
  derivedStats: { health: 10, stamina: 10, armorClass: 10 },
  textCombat: {
    maxStamina: 10,
    stamina: 10,
    stance: "balanced",
    distance: "melee",
    balance: 0,
    knownTechniques: [],
    detailedRolls: false,
    injuries: [{ id: "leg", type: "limbInjury", zone: "leftLeg", severity: "moderate", persistent: true }],
  },
  magic: {
    canUseMagic: false, mana: 0, maxMana: 0, manaRegeneration: 0, magicLevel: 0, magicExperience: 0,
    knownWords: [], knownSpellFormulas: [], customSpellFormulas: [], cooldowns: {}, corruption: 0, instability: 0,
    grimoireUnlocked: false, activeEffects: [{ id: "haste", effectType: "hastened", remainingTurns: 1 }],
  },
  createdAt: new Date(0).toISOString(),
};
const inventory: InventoryState = {
  items: [{
    id: "ring-1", templateId: "test_ring", nameKey: "test", descriptionKey: "test", category: "accessory",
    rarity: "common", quantity: 1, weight: 0, value: 1, equippable: true, slot: "leftRing", icon: "",
    attributeBonuses: { strength: 2 }, createdAt: new Date(0).toISOString(),
  }],
  equipment: { leftRing: "ring-1" }, gold: 0, maxCarryWeight: 50,
};

const effective = resolveEffectivePlayerStats(player, inventory);
assert(effective.strength === 15, "Equipped attribute bonuses must apply exactly once.");
assert(effective.dexterity === 13, "Haste and a leg injury must both affect effective dexterity.");
assert(player.attributes.strength === 13, "Effective stats must not mutate persisted creation attributes.");
const highConstitution = createPlayerCombatStats({ ...player, attributes: { ...player.attributes, constitution: 16 } }, inventory);
const lowConstitution = createPlayerCombatStats({ ...player, attributes: { ...player.attributes, constitution: 8 } }, inventory);
assert(highConstitution.maxHealth > lowConstitution.maxHealth, "Constitution must change maximum health.");
