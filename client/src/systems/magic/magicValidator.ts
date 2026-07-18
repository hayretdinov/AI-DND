import type { GameSave } from "../save/saveSystem";
import { magicConfig } from "./magicConfig";
import { findSpellByWordIds } from "./spellDefinitions";
import { getMagicWordById } from "./magicWords";
import type { MagicValidationResult, ParsedMagicFormula, PlayerMagicState } from "./magicTypes";

const masteryRank = {
  heard: 0,
  understood: 1,
  mastered: 2,
  comprehended: 3,
} as const;

type MagicValidationContext = {
  inCombat: boolean;
  hasTarget: boolean;
  canSpeak?: boolean;
  canGesture?: boolean;
};

function getKnownWord(magic: PlayerMagicState, wordId: string) {
  return magic.knownWords.find((word) => word.wordId === wordId);
}

function hasSilence(magic: PlayerMagicState) {
  return magic.activeEffects.some((effect) => effect.effectType === "silence" && effect.remainingTurns > 0);
}

function getManaCost(magic: PlayerMagicState, parsed: ParsedMagicFormula, baseCost: number) {
  const modifierCost = parsed.knownWordIds.reduce((total, wordId) => total + (getMagicWordById(wordId)?.manaModifier ?? 0), 0);
  const levelDiscount = Math.max(0, magic.magicLevel - 1);

  return Math.max(1, Math.ceil((baseCost + modifierCost - levelDiscount) * magicConfig.manaCostMultiplier));
}

function knowsSpellFormula(magic: PlayerMagicState, spellId: string) {
  return magic.knownSpellFormulas.some((formula) => formula.spellId === spellId);
}

function canFreelyCombineRequiredWords(magic: PlayerMagicState, wordIds: string[]) {
  return wordIds.every((wordId) => {
    const knownWord = getKnownWord(magic, wordId);

    return knownWord ? masteryRank[knownWord.masteryLevel] >= masteryRank.mastered : false;
  });
}

export function validateMagicFormula(
  save: GameSave,
  parsedFormula: ParsedMagicFormula | null,
  context: MagicValidationContext,
): MagicValidationResult {
  if (!parsedFormula) {
    return { ok: false, reason: "no_formula", messageKey: "magic.message.noFormula" };
  }

  const magic = save.player.magic;

  if (!magic?.canUseMagic) {
    return { ok: false, reason: "not_magic_user", messageKey: "magic.message.notMagicUser", parsedFormula };
  }

  if (hasSilence(magic)) {
    return { ok: false, reason: "silenced", messageKey: "magic.message.silenced", parsedFormula };
  }

  if (context.canSpeak === false) {
    return { ok: false, reason: "cannot_speak", messageKey: "magic.message.cannotSpeak", parsedFormula };
  }

  if (parsedFormula.unknownTokens.length > 0) {
    return {
      ok: false,
      reason: "unknown_word",
      messageKey: "magic.message.unknownWord",
      parsedFormula,
      unknownTokens: parsedFormula.unknownTokens,
    };
  }

  const missingWordIds = parsedFormula.knownWordIds.filter((wordId) => !getKnownWord(magic, wordId));

  if (missingWordIds.length > 0) {
    return { ok: false, reason: "word_not_learned", messageKey: "magic.message.wordNotLearned", parsedFormula, missingWordIds };
  }

  const heardOnlyWordIds = parsedFormula.knownWordIds.filter((wordId) => getKnownWord(magic, wordId)?.masteryLevel === "heard");

  if (heardOnlyWordIds.length > 0) {
    return { ok: false, reason: "word_only_heard", messageKey: "magic.message.wordOnlyHeard", parsedFormula, missingWordIds: heardOnlyWordIds };
  }

  const spell = findSpellByWordIds(parsedFormula.knownWordIds);

  if (!spell) {
    return { ok: false, reason: "unknown_spell", messageKey: "magic.message.unknownSpell", parsedFormula };
  }

  const insufficientMastery = spell.requiredWordIds.filter((wordId) => {
    const word = getMagicWordById(wordId);
    const knownWord = getKnownWord(magic, wordId);

    return !knownWord || masteryRank[knownWord.masteryLevel] < 1 || (word?.requiredMagicLevel ?? 1) > magic.magicLevel;
  });

  if (insufficientMastery.length > 0) {
    return { ok: false, reason: "insufficient_mastery", messageKey: "magic.message.insufficientMastery", parsedFormula, missingWordIds: insufficientMastery };
  }

  if (!knowsSpellFormula(magic, spell.id) && !canFreelyCombineRequiredWords(magic, spell.requiredWordIds)) {
    return { ok: false, reason: "insufficient_mastery", messageKey: "magic.message.insufficientMastery", parsedFormula, missingWordIds: spell.requiredWordIds };
  }

  const hasForbidden = parsedFormula.knownWordIds.some((wordId) => getMagicWordById(wordId)?.forbidden);

  if (hasForbidden && !magicConfig.allowForbiddenMagic) {
    return { ok: false, reason: "forbidden_magic", messageKey: "magic.message.forbiddenMagic", parsedFormula };
  }

  if (spell.combatOnly && !context.inCombat) {
    return { ok: false, reason: "combat_only", messageKey: "magic.message.combatOnly", parsedFormula };
  }

  if (!context.inCombat && !magicConfig.allowOutOfCombatMagic) {
    return { ok: false, reason: "out_of_combat_disabled", messageKey: "magic.message.outOfCombatDisabled", parsedFormula };
  }

  if (spell.requiresTarget && !context.hasTarget) {
    return { ok: false, reason: "missing_target", messageKey: "magic.message.missingTarget", parsedFormula };
  }

  if ((magic.cooldowns[spell.id] ?? 0) > 0) {
    return { ok: false, reason: "cooldown", messageKey: "magic.message.cooldown", parsedFormula };
  }

  const manaCost = getManaCost(magic, parsedFormula, spell.manaCost);

  if (magic.mana < manaCost) {
    return { ok: false, reason: "insufficient_mana", messageKey: "magic.message.insufficientMana", parsedFormula };
  }

  return {
    ok: true,
    spell,
    manaCost,
    parsedFormula,
  };
}
