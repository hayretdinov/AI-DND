import type { CombatDistance, CombatMovement, WeaponCategory } from "./combatTextTypes";
import { getMeleeWeaponDefinition, toMeleeWeaponCategory } from "./meleeWeaponConfig";

const ORDER: CombatDistance[] = ["grapple", "veryClose", "melee", "reach", "medium"];

export function shiftDistance(current: CombatDistance, movement: CombatMovement, requested?: CombatDistance): CombatDistance {
  if (requested) {
    return requested;
  }

  const index = ORDER.indexOf(current);

  if (movement === "stepForward" || movement === "lunge" || movement === "rush") {
    return ORDER[Math.max(0, index - 1)] ?? current;
  }

  if (movement === "stepBack") {
    return ORDER[Math.min(ORDER.length - 1, index + 1)] ?? current;
  }

  return current;
}

export function getWeaponDistancePenalty(weaponCategory: WeaponCategory | undefined, distance: CombatDistance) {
  if (!weaponCategory) {
    return 0;
  }

  const meleeCategory = toMeleeWeaponCategory(weaponCategory);
  const definition = getMeleeWeaponDefinition(meleeCategory);

  if (definition) {
    if (definition.allowedDistances.includes(distance)) {
      return 0;
    }

    if (meleeCategory === "spear" || meleeCategory === "staff" || weaponCategory === "twoHandedSword") {
      return distance === "veryClose" || distance === "grapple" ? 3 : 2;
    }

    if (meleeCategory === "dagger" || meleeCategory === "knife" || meleeCategory === "unarmed") {
      return distance === "reach" || distance === "medium" ? 4 : 2;
    }

    return distance === "reach" ? 2 : 3;
  }

  if (weaponCategory === "dagger" || weaponCategory === "unarmed") {
    return distance === "grapple" || distance === "veryClose" ? 0 : distance === "melee" ? 1 : 4;
  }

  if (weaponCategory === "bow" || weaponCategory === "throwing") {
    return distance === "medium" || distance === "reach" ? 0 : 4;
  }

  if (weaponCategory === "staff" || weaponCategory === "twoHandedSword") {
    return distance === "reach" || distance === "melee" ? 0 : distance === "veryClose" ? 2 : 3;
  }

  return distance === "melee" || distance === "veryClose" ? 0 : distance === "reach" ? 1 : 3;
}
