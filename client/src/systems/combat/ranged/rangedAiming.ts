import { rangedCombatConfig } from "./rangedCombatConfig";
import type { AimState, ParsedRangedAction, RangedShotType, RangedStance } from "./rangedCombatTypes";

export function getShotType(action: ParsedRangedAction): RangedShotType {
  if (action.shotType) {
    return action.shotType;
  }

  if (action.intent === "quickShot") {
    return "quick";
  }

  if (action.intent === "snapShot") {
    return "snap";
  }

  if (action.intent === "preciseShot") {
    return "precise";
  }

  if (action.intent === "powerShot") {
    return "power";
  }

  if (action.intent === "leadingShot") {
    return "leading";
  }

  if (action.intent === "readyShot") {
    return "prepared";
  }

  return "normal";
}

export function increaseAim(current: AimState | undefined, action: ParsedRangedAction): AimState {
  return {
    level: Math.min(rangedCombatConfig.maximumAimLevel, (current?.level ?? 0) + 1),
    targetId: action.targetId ?? current?.targetId,
    targetZone: action.targetZone ?? current?.targetZone,
  };
}

export function getAimModifier(aimState: AimState | undefined, action: ParsedRangedAction) {
  const shotType = getShotType(action);
  const aimBonus = (aimState?.level ?? 0) * rangedCombatConfig.aimBonusPerLevel;

  if (shotType === "quick" || shotType === "snap") {
    return -2;
  }

  if (shotType === "precise") {
    return aimBonus + 1;
  }

  if (shotType === "prepared") {
    return aimBonus + 2;
  }

  return aimBonus;
}

export function getStanceModifier(stance?: RangedStance) {
  if (stance === "kneeling" || stance === "fromCover") {
    return 1;
  }

  if (stance === "prone") {
    return 2;
  }

  if (stance === "moving") {
    return -2;
  }

  return 0;
}
