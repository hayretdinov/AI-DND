import type { DamageType } from "../../types/combat";

export type MagicWordCategory =
  | "element"
  | "form"
  | "action"
  | "power"
  | "target"
  | "direction"
  | "modifier"
  | "forbidden"
  | "special";

export type MagicMasteryLevel = "heard" | "understood" | "mastered" | "comprehended";

export type MagicSchool =
  | "fire"
  | "cold"
  | "lightning"
  | "water"
  | "earth"
  | "air"
  | "light"
  | "shadow"
  | "life"
  | "death"
  | "arcane"
  | "nature"
  | "blood"
  | "mind"
  | "time";

export type MagicWord = {
  id: string;
  word: string;
  normalizedWord: string;
  category: MagicWordCategory;
  meaning: string;
  description: string;
  requiredMagicLevel: number;
  manaModifier: number;
  riskModifier: number;
  forbidden: boolean;
  aliases: string[];
  localizationKey: string;
  compatibleCategories: MagicWordCategory[];
  incompatibleWordIds: string[];
};

export type KnownMagicWord = {
  wordId: string;
  masteryLevel: MagicMasteryLevel;
  discoveredAt: string;
  learnedFrom: string;
  usageCount: number;
  successfulCastCount: number;
  failedCastCount: number;
  experience: number;
  isFavorite: boolean;
};

export type KnownSpellFormula = {
  id: string;
  spellId: string;
  wordIds: string[];
  discoveredAt: string;
  learnedFrom: string;
  successfulCastCount: number;
  failedCastCount: number;
  isFavorite: boolean;
};

export type CustomSpellFormula = {
  id: string;
  name: string;
  wordIds: string[];
  createdAt: string;
  usageCount: number;
};

export type ActiveMagicEffect = {
  id: string;
  effectType: "silence" | "light" | "burning" | "ward" | "slowed" | "hastened";
  sourceSpellId?: string;
  remainingTurns: number;
};

export type PlayerMagicState = {
  canUseMagic: boolean;
  mana: number;
  maxMana: number;
  manaRegeneration: number;
  magicLevel: number;
  magicExperience: number;
  knownWords: KnownMagicWord[];
  knownSpellFormulas: KnownSpellFormula[];
  customSpellFormulas: CustomSpellFormula[];
  activeEffects: ActiveMagicEffect[];
  cooldowns: Record<string, number>;
  corruption: number;
  instability: number;
  preferredSchool?: MagicSchool;
  equippedFocusId?: string;
  grimoireUnlocked: boolean;
};

export type MagicConfig = {
  typoTolerance: number;
  baseInstabilityChance: number;
  unknownWordPenalty: number;
  forbiddenWordCorruption: number;
  maxWordsPerFormula: number;
  manaCostMultiplier: number;
  customSpellEnabled: boolean;
  maxCustomSpells: number;
  repetitionExperienceCooldown: number;
  criticalFailureEnabled: boolean;
  friendlyFireEnabled: boolean;
  allowOutOfCombatMagic: boolean;
  allowForbiddenMagic: boolean;
};

export type SpellDefinition = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  requiredWordIds: string[];
  optionalWordIds?: string[];
  school: MagicSchool;
  manaCost: number;
  difficultyClass: number;
  requiresTarget: boolean;
  combatOnly: boolean;
  damageDice?: string;
  damageType?: DamageType;
  healingDice?: string;
  effectType?: ActiveMagicEffect["effectType"];
  cooldownTurns?: number;
};

export type ParsedMagicWord = {
  rawToken: string;
  normalizedToken: string;
  word?: MagicWord;
  unknown: boolean;
};

export type ParsedMagicFormula = {
  rawText: string;
  formulaText: string;
  words: ParsedMagicWord[];
  knownWordIds: string[];
  unknownTokens: string[];
};

export type MagicValidationFailureReason =
  | "no_formula"
  | "not_magic_user"
  | "silenced"
  | "cannot_speak"
  | "unknown_word"
  | "word_not_learned"
  | "word_only_heard"
  | "insufficient_mastery"
  | "incompatible_words"
  | "forbidden_magic"
  | "insufficient_mana"
  | "missing_target"
  | "cooldown"
  | "combat_only"
  | "out_of_combat_disabled"
  | "unknown_spell";

export type MagicValidationResult =
  | {
      ok: true;
      spell: SpellDefinition;
      manaCost: number;
      parsedFormula: ParsedMagicFormula;
    }
  | {
      ok: false;
      reason: MagicValidationFailureReason;
      messageKey: string;
      parsedFormula?: ParsedMagicFormula;
      missingWordIds?: string[];
      unknownTokens?: string[];
    };

export type SpellResolutionResult = {
  ok: boolean;
  validation: MagicValidationResult;
  narrationKey: string;
  manaSpent: number;
  damage?: number;
  healing?: number;
  critical?: boolean;
  fumble?: boolean;
  roll?: number;
};
