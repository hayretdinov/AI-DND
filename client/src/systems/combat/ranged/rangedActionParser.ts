import type { BodyZone, CombatMovement } from "../text";
import {
  RANGED_AMMO_PHRASES,
  RANGED_CLAIMED_OUTCOME_PHRASES,
  RANGED_INTENT_PHRASES,
  RANGED_MOVEMENT_PHRASES,
  RANGED_SHOT_TYPE_PHRASES,
  RANGED_STANCE_PHRASES,
  RANGED_WEAPON_PHRASES,
  RANGED_ZONE_PHRASES,
  normalizeRangedText,
  type PhraseEntry,
} from "./rangedVocabulary";
import { inferCoverFromText } from "./rangedCover";
import type {
  AmmoCategory,
  ParsedRangedAction,
  RangedCombatIntent,
  RangedParseWarning,
  RangedShotType,
  RangedStance,
  RangedWeaponCategory,
} from "./rangedCombatTypes";

function findPhrase<T extends string>(text: string, entries: Array<PhraseEntry<T>>) {
  for (const entry of entries) {
    const phrase = entry.phrases.find((candidate) => text.includes(candidate));

    if (phrase) {
      return { value: entry.value, phrase };
    }
  }

  return undefined;
}

function collectUnknownTokens(text: string, matchedPhrases: string[]) {
  const matchedWords = new Set(matchedPhrases.flatMap((phrase) => phrase.split(/\s+/)));

  return text
    .split(/\s+/)
    .filter((token) => token.length > 3 && !matchedWords.has(token))
    .slice(0, 8);
}

function resolveIntent(normalizedText: string): { intent: RangedCombatIntent; phrase?: string } {
  const exact = findPhrase(normalizedText, RANGED_INTENT_PHRASES);

  if (exact) {
    return { intent: exact.value, phrase: exact.phrase };
  }

  return { intent: "unknown" };
}

export function parseRangedCombatAction(text: string, actorId = "player", targetId?: string): ParsedRangedAction {
  const normalizedText = normalizeRangedText(text);
  const matchedPhrases: string[] = [];
  const warnings: RangedParseWarning[] = [];
  const { intent, phrase: intentPhrase } = resolveIntent(normalizedText);
  const weapon = findPhrase<RangedWeaponCategory>(normalizedText, RANGED_WEAPON_PHRASES);
  const ammo = findPhrase<AmmoCategory>(normalizedText, RANGED_AMMO_PHRASES);
  const targetZone = findPhrase<BodyZone>(normalizedText, RANGED_ZONE_PHRASES);
  const stance = findPhrase<RangedStance>(normalizedText, RANGED_STANCE_PHRASES);
  const movement = findPhrase<CombatMovement>(normalizedText, RANGED_MOVEMENT_PHRASES);
  const shotType = findPhrase<RangedShotType>(normalizedText, RANGED_SHOT_TYPE_PHRASES);
  const claimedOutcome = RANGED_CLAIMED_OUTCOME_PHRASES.find((phrase) => normalizedText.includes(phrase));

  for (const match of [weapon, ammo, targetZone, stance, movement, shotType]) {
    if (match?.phrase) {
      matchedPhrases.push(match.phrase);
    }
  }

  if (intentPhrase) {
    matchedPhrases.push(intentPhrase);
  }

  if (claimedOutcome) {
    warnings.push("claimedOutcome");
    matchedPhrases.push(claimedOutcome);
  }

  const isOverloaded = normalizedText.split(/\s+/).length > 38;
  if (isOverloaded) {
    warnings.push("overloadedAction");
  }

  const combatSignals = matchedPhrases.length + (intent !== "unknown" ? 2 : 0) + (weapon ? 1 : 0);
  let confidence = Math.min(1, combatSignals / 6);

  if (intent === "unknown") {
    warnings.push("nonCombatText");
    confidence = Math.min(confidence, 0.2);
  }

  if (confidence < 0.35) {
    warnings.push("lowConfidence");
  }

  return {
    rawText: text,
    normalizedText,
    actorId,
    targetId,
    intent,
    weaponCategory: weapon?.value,
    ammoCategory: ammo?.value,
    shotType: shotType?.value,
    targetZone: targetZone?.value,
    stance: stance?.value,
    aimingRequested: intent === "aim" || Boolean(normalizedText.includes("прицел")),
    movement: movement?.value ?? "none",
    coverRequested: inferCoverFromText(normalizedText),
    readyCondition: intent === "readyShot" ? text : undefined,
    unknownTokens: collectUnknownTokens(normalizedText, matchedPhrases),
    matchedPhrases,
    confidence,
    isOverloaded,
    warnings: Array.from(new Set(warnings)),
  };
}
