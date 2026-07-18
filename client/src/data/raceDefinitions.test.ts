import {
  ATTRIBUTE_KEYS,
  BASE_ATTRIBUTES,
  RACE_DEFINITIONS,
  calculateFinalAttributes,
  createEmptyAttributeAllocation,
  getSpentAttributePoints,
  getStartingAttributePointTotal,
  inferAllocatedAttributes,
} from "./raceDefinitions";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const race of Object.values(RACE_DEFINITIONS)) {
  for (const attribute of ATTRIBUTE_KEYS) {
    assert(Number.isFinite(race.statModifiers[attribute]), `${race.id} must define ${attribute}.`);
  }
}

assert(RACE_DEFINITIONS.human.statModifiers.charisma === 1, "Human must gain charisma.");
assert(getStartingAttributePointTotal("human") === 13, "Human must gain one extra attribute point.");
assert(RACE_DEFINITIONS.elf.statModifiers.dexterity === 2, "Elf must gain dexterity.");
assert(RACE_DEFINITIONS.elf.statModifiers.intelligence === 1, "Elf must gain intelligence.");
assert(RACE_DEFINITIONS.dwarf.statModifiers.constitution === 2, "Dwarf must gain constitution.");
assert(RACE_DEFINITIONS.orc.statModifiers.strength === 2, "Orc must gain strength.");
assert(RACE_DEFINITIONS.orc.statModifiers.charisma === -2, "Orc must lose charisma.");

const allocation = createEmptyAttributeAllocation();
allocation.strength = 3;
const orcStats = calculateFinalAttributes(BASE_ATTRIBUTES, allocation, "orc");
assert(orcStats.strength === 13, "Racial modifiers must apply exactly once.");
assert(inferAllocatedAttributes(orcStats, "orc").strength === 3, "Loaded racial stats must not duplicate bonuses.");
assert(getSpentAttributePoints(allocation) === 3, "Spent points must come from allocation only.");
