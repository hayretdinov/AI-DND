import type { TranslationKey } from "../../i18n/i18n";
import type { GameSave } from "../../systems/save/saveSystem";

export const ANARIEL_ADVICE_PORTRAIT = "/assets/companions/anariel/anariel_travel_rags.png";

export const anarielWorldAdviceKeys = [
  "companion.anariel.worldAdvice.1",
  "companion.anariel.worldAdvice.2",
  "companion.anariel.worldAdvice.3",
  "companion.anariel.worldAdvice.4",
  "companion.anariel.worldAdvice.5",
] as const satisfies readonly TranslationKey[];

// TODO: in CampScene, use the same companion advice system for longer conversations with Anariel.

export function isAnarielActiveCompanion(save: GameSave | null) {
  const anariel = save?.companions?.anariel;

  return Boolean(
    anariel?.isTravellingWithPlayer ||
      anariel?.status === "companion" ||
      anariel?.status === "rescued",
  );
}

export function getAnarielWorldAdviceKey(index: number): TranslationKey {
  return anarielWorldAdviceKeys[index % anarielWorldAdviceKeys.length];
}

export function getAnarielGateAdviceKey(): TranslationKey {
  return "companion.anariel.gateAdvice";
}
