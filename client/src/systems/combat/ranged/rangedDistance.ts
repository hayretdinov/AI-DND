import type { CombatDistance, CombatMovement } from "../text";
import type { RangedWeaponCategory } from "./rangedCombatTypes";
import { rangedWeaponConfig } from "./rangedCombatConfig";

const DISTANCE_INDEX: Record<CombatDistance, number> = {
  grapple: 0,
  veryClose: 1,
  melee: 2,
  reach: 3,
  medium: 4,
};

const ORDER: CombatDistance[] = ["grapple", "veryClose", "melee", "reach", "medium"];

export function shiftRangedDistance(current: CombatDistance, movement: CombatMovement): CombatDistance {
  const index = DISTANCE_INDEX[current] ?? 2;

  if (movement === "stepForward" || movement === "lunge" || movement === "rush") {
    return ORDER[Math.max(0, index - 1)] ?? current;
  }

  if (movement === "stepBack") {
    return ORDER[Math.min(ORDER.length - 1, index + 1)] ?? current;
  }

  return current;
}

export function getRangedDistancePenalty(category: RangedWeaponCategory, distance: CombatDistance) {
  const config = rangedWeaponConfig[category];
  const distanceIndex = DISTANCE_INDEX[distance] ?? config.optimalDistance;

  if (distanceIndex < config.minDistance || distanceIndex > config.maxDistance) {
    return 6;
  }

  return Math.abs(distanceIndex - config.optimalDistance);
}
