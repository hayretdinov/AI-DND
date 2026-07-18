import type { ParsedRangedAction } from "./rangedCombatTypes";

export function normalizeRangedCombatAction(action: ParsedRangedAction): ParsedRangedAction {
  const shotType =
    action.shotType ??
    (action.intent === "quickShot"
      ? "quick"
      : action.intent === "preciseShot"
        ? "precise"
        : action.intent === "powerShot"
          ? "power"
          : action.intent === "leadingShot"
            ? "leading"
            : action.intent === "readyShot"
              ? "prepared"
              : "normal");

  return {
    ...action,
    shotType,
    targetZone: action.targetZone ?? "torso",
  };
}
