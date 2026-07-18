import type { SpellDefinition } from "./magicTypes";

export const spellDefinitions: SpellDefinition[] = [
  {
    id: "spark",
    nameKey: "magic.spell.spark.name",
    descriptionKey: "magic.spell.spark.description",
    requiredWordIds: ["ignis", "manus", "minora"],
    school: "fire",
    manaCost: 6,
    difficultyClass: 9,
    requiresTarget: false,
    combatOnly: false,
    damageDice: "1d4",
    damageType: "fire",
    cooldownTurns: 0,
  },
  {
    id: "fire_lance",
    nameKey: "magic.spell.fireLance.name",
    descriptionKey: "magic.spell.fireLance.description",
    requiredWordIds: ["ignis", "lancea", "hostis"],
    optionalWordIds: ["fero", "minora", "norma", "magna"],
    school: "fire",
    manaCost: 11,
    difficultyClass: 12,
    requiresTarget: true,
    combatOnly: false,
    damageDice: "1d8",
    damageType: "fire",
    cooldownTurns: 1,
  },
  {
    id: "magic_light",
    nameKey: "magic.spell.magicLight.name",
    descriptionKey: "magic.spell.magicLight.description",
    requiredWordIds: ["lumen", "sphere", "minora"],
    school: "light",
    manaCost: 5,
    difficultyClass: 8,
    requiresTarget: false,
    combatOnly: false,
    effectType: "light",
    cooldownTurns: 0,
  },
  {
    id: "minor_heal",
    nameKey: "magic.spell.minorHeal.name",
    descriptionKey: "magic.spell.minorHeal.description",
    requiredWordIds: ["vitar", "sano", "minora"],
    optionalWordIds: ["mea", "socius"],
    school: "life",
    manaCost: 8,
    difficultyClass: 10,
    requiresTarget: false,
    combatOnly: false,
    healingDice: "1d6",
    cooldownTurns: 1,
  },
];

export function getSpellDefinitionById(spellId: string) {
  return spellDefinitions.find((spell) => spell.id === spellId);
}

export function findSpellByWordIds(wordIds: string[]) {
  const wordSet = new Set(wordIds);

  return spellDefinitions.find((spell) => spell.requiredWordIds.every((wordId) => wordSet.has(wordId)));
}
