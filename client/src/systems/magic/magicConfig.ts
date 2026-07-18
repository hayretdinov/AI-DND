import type { MagicConfig } from "./magicTypes";

export const magicConfig: MagicConfig = {
  typoTolerance: 1,
  baseInstabilityChance: 0.05,
  unknownWordPenalty: 2,
  forbiddenWordCorruption: 12,
  maxWordsPerFormula: 6,
  manaCostMultiplier: 1,
  customSpellEnabled: false,
  maxCustomSpells: 0,
  repetitionExperienceCooldown: 3,
  criticalFailureEnabled: true,
  friendlyFireEnabled: false,
  allowOutOfCombatMagic: true,
  allowForbiddenMagic: false,
};
