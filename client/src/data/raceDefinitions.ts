import type { Attributes, PlayerRace } from "../types/player";
import type { TranslationKey } from "../i18n/i18n";

export const STARTING_STAT_MIN = 3;
export const STARTING_STAT_MAX = 16;
export const BASE_ATTRIBUTE_VALUE = 8;
export const BASE_ATTRIBUTE_POINTS = 12;
export const RACIAL_STATS_SCHEMA_VERSION = 1;

export type AttributeKey = keyof Attributes;
export type AttributeAllocation = Record<AttributeKey, number>;

export type RaceDefinition = {
  id: PlayerRace;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  statModifiers: Attributes;
  extraStartingAttributePoints?: number;
};

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "constitution",
  "dexterity",
  "intelligence",
  "wisdom",
  "charisma",
];

export const ZERO_ATTRIBUTES: Attributes = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

export const BASE_ATTRIBUTES: Attributes = {
  strength: BASE_ATTRIBUTE_VALUE,
  dexterity: BASE_ATTRIBUTE_VALUE,
  constitution: BASE_ATTRIBUTE_VALUE,
  intelligence: BASE_ATTRIBUTE_VALUE,
  wisdom: BASE_ATTRIBUTE_VALUE,
  charisma: BASE_ATTRIBUTE_VALUE,
};

export const RACE_DEFINITIONS: Record<PlayerRace, RaceDefinition> = {
  human: {
    id: "human",
    nameKey: "raceHuman",
    descriptionKey: "raceHumanDescription",
    statModifiers: {
      ...ZERO_ATTRIBUTES,
      charisma: 1,
    },
    extraStartingAttributePoints: 1,
  },
  elf: {
    id: "elf",
    nameKey: "raceElf",
    descriptionKey: "raceElfDescription",
    statModifiers: {
      ...ZERO_ATTRIBUTES,
      strength: -1,
      constitution: -1,
      dexterity: 2,
      intelligence: 1,
    },
  },
  dwarf: {
    id: "dwarf",
    nameKey: "raceDwarf",
    descriptionKey: "raceDwarfDescription",
    statModifiers: {
      ...ZERO_ATTRIBUTES,
      strength: 1,
      constitution: 2,
      dexterity: -1,
    },
  },
  orc: {
    id: "orc",
    nameKey: "raceOrc",
    descriptionKey: "raceOrcDescription",
    statModifiers: {
      ...ZERO_ATTRIBUTES,
      strength: 2,
      constitution: 1,
      intelligence: -1,
      charisma: -2,
    },
  },
};

export function getRaceDefinition(race: PlayerRace): RaceDefinition {
  return RACE_DEFINITIONS[race] ?? RACE_DEFINITIONS.human;
}

export function getStartingAttributePointTotal(race: PlayerRace): number {
  return BASE_ATTRIBUTE_POINTS + (getRaceDefinition(race).extraStartingAttributePoints ?? 0);
}

export function createEmptyAttributeAllocation(): AttributeAllocation {
  return { ...ZERO_ATTRIBUTES };
}

function clampStat(value: number) {
  return Math.max(STARTING_STAT_MIN, Math.min(STARTING_STAT_MAX, value));
}

export function calculateFinalAttributes(
  baseAttributes: Attributes,
  allocatedAttributes: AttributeAllocation,
  race: PlayerRace,
): Attributes {
  const modifiers = getRaceDefinition(race).statModifiers;

  return ATTRIBUTE_KEYS.reduce((attributes, attribute) => ({
    ...attributes,
    [attribute]: clampStat(baseAttributes[attribute] + allocatedAttributes[attribute] + modifiers[attribute]),
  }), { ...baseAttributes });
}

export function inferAllocatedAttributes(attributes: Attributes, race: PlayerRace): AttributeAllocation {
  const modifiers = getRaceDefinition(race).statModifiers;

  return ATTRIBUTE_KEYS.reduce((allocation, attribute) => ({
    ...allocation,
    [attribute]: Math.max(0, attributes[attribute] - BASE_ATTRIBUTES[attribute] - modifiers[attribute]),
  }), createEmptyAttributeAllocation());
}

export function getSpentAttributePoints(allocatedAttributes: AttributeAllocation): number {
  return ATTRIBUTE_KEYS.reduce((total, attribute) => total + Math.max(0, allocatedAttributes[attribute]), 0);
}
