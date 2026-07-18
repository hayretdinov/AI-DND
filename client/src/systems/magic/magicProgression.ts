import type { PlayerClass } from "../../types/player";
import type { KnownMagicWord, KnownSpellFormula, MagicMasteryLevel, PlayerMagicState } from "./magicTypes";

const STARTING_MAGE_WORDS = ["ignis", "manus", "minora", "lumen", "sphere", "mea"] as const;
const STARTING_MAGE_FORMULAS = [
  { id: "formula_spark", spellId: "spark", wordIds: ["ignis", "manus", "minora"] },
  { id: "formula_magic_light", spellId: "magic_light", wordIds: ["lumen", "sphere", "minora"] },
] as const;

function createKnownWord(wordId: string, masteryLevel: MagicMasteryLevel, learnedFrom: string): KnownMagicWord {
  return {
    wordId,
    masteryLevel,
    discoveredAt: new Date(0).toISOString(),
    learnedFrom,
    usageCount: 0,
    successfulCastCount: 0,
    failedCastCount: 0,
    experience: 0,
    isFavorite: false,
  };
}

function createKnownSpellFormula(id: string, spellId: string, wordIds: readonly string[], learnedFrom: string): KnownSpellFormula {
  return {
    id,
    spellId,
    wordIds: [...wordIds],
    discoveredAt: new Date(0).toISOString(),
    learnedFrom,
    successfulCastCount: 0,
    failedCastCount: 0,
    isFavorite: false,
  };
}

export function createDefaultMagicState(characterClass?: PlayerClass): PlayerMagicState {
  const isMage = characterClass === "mage";

  return {
    canUseMagic: isMage,
    mana: isMage ? 30 : 0,
    maxMana: isMage ? 30 : 0,
    manaRegeneration: isMage ? 3 : 0,
    magicLevel: isMage ? 1 : 0,
    magicExperience: 0,
    knownWords: isMage ? STARTING_MAGE_WORDS.map((wordId) => createKnownWord(wordId, "understood", "starting_mage")) : [],
    knownSpellFormulas: isMage
      ? STARTING_MAGE_FORMULAS.map((formula) => createKnownSpellFormula(formula.id, formula.spellId, formula.wordIds, "starting_mage"))
      : [],
    customSpellFormulas: [],
    activeEffects: [],
    cooldowns: {},
    corruption: 0,
    instability: 0,
    preferredSchool: isMage ? "arcane" : undefined,
    equippedFocusId: undefined,
    grimoireUnlocked: isMage,
  };
}

export function recordMagicAttempt(magic: PlayerMagicState, wordIds: string[], success: boolean): PlayerMagicState {
  return {
    ...magic,
    magicExperience: magic.magicExperience + (success ? 3 : 1),
    knownWords: magic.knownWords.map((knownWord) =>
      wordIds.includes(knownWord.wordId)
        ? {
            ...knownWord,
            usageCount: knownWord.usageCount + 1,
            successfulCastCount: knownWord.successfulCastCount + (success ? 1 : 0),
            failedCastCount: knownWord.failedCastCount + (success ? 0 : 1),
            experience: knownWord.experience + (success ? 2 : 1),
          }
        : knownWord,
    ),
  };
}

export function learnMagicWord(magic: PlayerMagicState, wordId: string, masteryLevel: MagicMasteryLevel, learnedFrom: string): PlayerMagicState {
  if (magic.knownWords.some((word) => word.wordId === wordId)) {
    return {
      ...magic,
      knownWords: magic.knownWords.map((word) => word.wordId === wordId ? { ...word, masteryLevel } : word),
    };
  }

  return {
    ...magic,
    knownWords: [...magic.knownWords, createKnownWord(wordId, masteryLevel, learnedFrom)],
  };
}

export function learnSpellFormula(
  magic: PlayerMagicState,
  spellId: string,
  wordIds: readonly string[],
  learnedFrom: string,
): PlayerMagicState {
  if (magic.knownSpellFormulas.some((formula) => formula.spellId === spellId)) {
    return magic;
  }

  return {
    ...magic,
    knownSpellFormulas: [
      ...magic.knownSpellFormulas,
      createKnownSpellFormula(`formula_${spellId}`, spellId, wordIds, learnedFrom),
    ],
  };
}
