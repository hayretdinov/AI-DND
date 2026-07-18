import type { DamageType } from "../../../types/combat";
import type { BodyZone, CombatInjury } from "./combatTextTypes";

function createInjury(type: CombatInjury["type"], zone: BodyZone | undefined, severity: CombatInjury["severity"], source: string): CombatInjury {
  return {
    id: `injury-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    zone,
    severity,
    remainingTurns: severity === "minor" ? 2 : severity === "moderate" ? 4 : undefined,
    persistent: severity === "severe",
    source,
  };
}

export function getCombatInjuriesForHit(options: {
  zone?: BodyZone;
  damage: number;
  critical: boolean;
  damageType: DamageType;
}) {
  const injuries: CombatInjury[] = [];

  if (!options.critical && options.damage < 5) {
    return injuries;
  }

  const severity: CombatInjury["severity"] = options.critical || options.damage >= 9 ? "severe" : options.damage >= 6 ? "moderate" : "minor";

  if (options.zone === "head" || options.zone === "neck") {
    injuries.push(createInjury(options.damageType === "bludgeoning" ? "concussion" : "deepWound", options.zone, severity, "targeted hit"));
  } else if (options.zone === "leftArm" || options.zone === "rightArm" || options.zone === "leftHand" || options.zone === "rightHand") {
    injuries.push(createInjury(options.damageType === "bludgeoning" ? "fracture" : "limbInjury", options.zone, severity, "targeted hit"));
  } else if (options.zone === "leftLeg" || options.zone === "rightLeg") {
    injuries.push(createInjury(options.damageType === "bludgeoning" ? "knockdown" : "limbInjury", options.zone, severity, "targeted hit"));
  } else if (options.zone === "weapon") {
    injuries.push(createInjury("disarm", options.zone, severity === "minor" ? "moderate" : severity, "weapon bind"));
  } else if (options.zone === "shield") {
    injuries.push(createInjury("shieldDamage", options.zone, severity, "shield pressure"));
  } else if (options.damageType === "piercing") {
    injuries.push(createInjury("puncture", options.zone, severity, "piercing hit"));
  } else {
    injuries.push(createInjury(options.damageType === "slashing" ? "bleeding" : "stagger", options.zone, severity, "heavy hit"));
  }

  return injuries.slice(0, 2);
}
