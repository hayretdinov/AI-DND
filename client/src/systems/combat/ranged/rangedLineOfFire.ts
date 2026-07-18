import type { CombatDistance } from "../text";
import type { ParsedRangedAction } from "./rangedCombatTypes";

export function hasLineOfFire(action: ParsedRangedAction, distance: CombatDistance) {
  if (distance === "grapple" && action.stance !== "moving") {
    return false;
  }

  if (action.normalizedText.includes("через стен") || action.normalizedText.includes("through wall")) {
    return false;
  }

  return true;
}
