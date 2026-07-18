import {
  ATTACK_TYPE_PHRASES,
  BODY_ZONE_PHRASES,
  CLAIMED_OUTCOME_PHRASES,
  DIRECTION_PHRASES,
  DISTANCE_PHRASES,
  GRIP_PHRASES,
  INTENT_PHRASES,
  MOVEMENT_PHRASES,
  POWER_PHRASES,
  STANCE_PHRASES,
  TECHNIQUE_PHRASES,
  TEMPO_PHRASES,
  WEAPON_PHRASES,
  normalizeCombatText,
  type PhraseEntry,
} from "./combatVocabulary";
import type {
  AttackDirection,
  AttackPower,
  AttackTempo,
  AttackType,
  BodyZone,
  CombatDistance,
  CombatIntent,
  CombatMovement,
  CombatParseWarning,
  CombatStance,
  CombatTechniqueId,
  ParsedCombatAction,
  WeaponCategory,
  WeaponGrip,
} from "./combatTextTypes";

function findPhrase<T extends string>(text: string, entries: Array<PhraseEntry<T>>) {
  for (const entry of entries) {
    const phrase = entry.phrases.find((candidate) => text.includes(candidate));

    if (phrase) {
      return { value: entry.value, phrase };
    }
  }

  return undefined;
}

function findAllIntents(text: string) {
  return INTENT_PHRASES.filter((entry) => entry.phrases.some((phrase) => text.includes(phrase)));
}

function collectUnknownTokens(text: string, matchedPhrases: string[]) {
  const matchedWords = new Set(matchedPhrases.flatMap((phrase) => phrase.split(/\s+/)));

  return text
    .split(/\s+/)
    .filter((token) => token.length > 3 && !matchedWords.has(token))
    .slice(0, 8);
}

function resolvePrimaryIntent(text: string): { intent: CombatIntent; phrase?: string } {
  const exact = findPhrase(text, INTENT_PHRASES);

  if (exact) {
    if (exact.value === "attack" && findPhrase(text, ATTACK_TYPE_PHRASES)) {
      return { intent: "weaponStrike", phrase: exact.phrase };
    }

    return { intent: exact.value, phrase: exact.phrase };
  }

  return { intent: "unknown" };
}

export function parseTextCombatAction(text: string, actorId = "player", targetId?: string): ParsedCombatAction {
  const normalizedText = normalizeCombatText(text);
  const matchedPhrases: string[] = [];
  const warnings: CombatParseWarning[] = [];
  const { intent, phrase: intentPhrase } = resolvePrimaryIntent(normalizedText);
  const allIntents = findAllIntents(normalizedText);

  if (intentPhrase) {
    matchedPhrases.push(intentPhrase);
  }

  const weapon = findPhrase<WeaponCategory>(normalizedText, WEAPON_PHRASES);
  const attackType = findPhrase<AttackType>(normalizedText, ATTACK_TYPE_PHRASES);
  const targetZone = findPhrase<BodyZone>(normalizedText, BODY_ZONE_PHRASES);
  const direction = findPhrase<AttackDirection>(normalizedText, DIRECTION_PHRASES);
  const power = findPhrase<AttackPower>(normalizedText, POWER_PHRASES);
  const tempo = findPhrase<AttackTempo>(normalizedText, TEMPO_PHRASES);
  const grip = findPhrase<WeaponGrip>(normalizedText, GRIP_PHRASES);
  const movement = findPhrase<CombatMovement>(normalizedText, MOVEMENT_PHRASES);
  const distance = findPhrase<CombatDistance>(normalizedText, DISTANCE_PHRASES);
  const stance = findPhrase<CombatStance>(normalizedText, STANCE_PHRASES);
  const technique = findPhrase<CombatTechniqueId>(normalizedText, TECHNIQUE_PHRASES);
  const claimedOutcome = CLAIMED_OUTCOME_PHRASES.find((phrase) => normalizedText.includes(phrase));

  for (const match of [weapon, attackType, targetZone, direction, power, tempo, grip, movement, distance, stance, technique]) {
    if (match?.phrase) {
      matchedPhrases.push(match.phrase);
    }
  }

  if (claimedOutcome) {
    warnings.push("claimedOutcome");
    matchedPhrases.push(claimedOutcome);
  }

  const isOverloaded = allIntents.length > 2 || normalizedText.split(/\s+/).length > 34;
  if (isOverloaded) {
    warnings.push("overloadedAction");
  }

  const combatSignals = matchedPhrases.length + (intent !== "unknown" ? 2 : 0);
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
    attackType: attackType?.value,
    defenseType:
      intent === "block" ? "block" :
      intent === "parry" ? "parry" :
      intent === "dodge" ? "dodge" :
      intent === "guard" || stance ? "guard" :
      "none",
    techniqueId: technique?.value,
    targetZone: targetZone?.value,
    direction: direction?.value ?? "unknown",
    power: power?.value ?? (claimedOutcome ? "heavy" : "normal"),
    tempo: tempo?.value ?? "normal",
    grip: grip?.value,
    movement: movement?.value ?? "none",
    requestedDistance: distance?.value,
    conditionalAction: normalizedText.includes("если") || normalizedText.includes("if ") ? text : undefined,
    secondaryMovement: undefined,
    unknownTokens: collectUnknownTokens(normalizedText, matchedPhrases),
    matchedPhrases,
    confidence,
    isOverloaded,
    warnings: Array.from(new Set(warnings)),
  };
}
