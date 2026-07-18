import type { DamageType } from "../../../types/combat";
import type { AttackType, BodyZone } from "./combatTextTypes";

export function getBodyZoneDifficulty(zone?: BodyZone) {
  switch (zone) {
    case "head":
    case "neck":
      return 4;
    case "leftHand":
    case "rightHand":
    case "weapon":
      return 3;
    case "leftArm":
    case "rightArm":
    case "leftLeg":
    case "rightLeg":
    case "shield":
      return 2;
    case "abdomen":
    case "chest":
      return 1;
    default:
      return 0;
  }
}

export function getZoneDamageModifier(zone?: BodyZone) {
  switch (zone) {
    case "head":
    case "neck":
      return 2;
    case "leftHand":
    case "rightHand":
    case "weapon":
    case "shield":
      return -1;
    default:
      return 0;
  }
}

export function getDamageTypeForAttack(attackType?: AttackType): DamageType {
  if (attackType === "thrust") {
    return "piercing";
  }

  if (attackType === "bash" || attackType === "pommel" || attackType === "kick" || attackType === "punch") {
    return "bludgeoning";
  }

  return "slashing";
}
