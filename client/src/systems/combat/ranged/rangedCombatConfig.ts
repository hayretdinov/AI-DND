import type { AmmoCategory, RangedWeaponCategory } from "./rangedCombatTypes";

export const rangedCombatConfig = {
  parserConfidenceThreshold: 0.35,
  allowAimAndShootSameTurn: true,
  aimBonusPerLevel: 2,
  maximumAimLevel: 2,
  criticalFailureEnabled: true,
  hiddenEnemyHp: true,
};

export const rangedWeaponConfig: Record<RangedWeaponCategory, {
  damageDice: string;
  minDistance: number;
  optimalDistance: number;
  maxDistance: number;
  reloadActions: number;
  canStoreLoaded: boolean;
  staminaCost: number;
  accuracy: number;
  armorPiercing: number;
  compatibleAmmo: AmmoCategory[];
}> = {
  handCrossbow: { damageDice: "1d6", minDistance: 1, optimalDistance: 2, maxDistance: 3, reloadActions: 1, canStoreLoaded: true, staminaCost: 1, accuracy: 1, armorPiercing: 0, compatibleAmmo: ["commonBolt", "armorPiercingBolt", "broadheadBolt", "fireBolt", "poisonBolt"] },
  lightCrossbow: { damageDice: "1d8", minDistance: 1, optimalDistance: 3, maxDistance: 4, reloadActions: 1, canStoreLoaded: true, staminaCost: 2, accuracy: 2, armorPiercing: 1, compatibleAmmo: ["commonBolt", "armorPiercingBolt", "broadheadBolt", "fireBolt", "poisonBolt"] },
  huntingCrossbow: { damageDice: "1d8+1", minDistance: 1, optimalDistance: 3, maxDistance: 4, reloadActions: 1, canStoreLoaded: true, staminaCost: 2, accuracy: 2, armorPiercing: 1, compatibleAmmo: ["commonBolt", "armorPiercingBolt", "broadheadBolt", "fireBolt", "poisonBolt"] },
  heavyCrossbow: { damageDice: "1d10", minDistance: 2, optimalDistance: 4, maxDistance: 5, reloadActions: 2, canStoreLoaded: true, staminaCost: 3, accuracy: 1, armorPiercing: 2, compatibleAmmo: ["commonBolt", "armorPiercingBolt", "broadheadBolt"] },
  shortBow: { damageDice: "1d6", minDistance: 1, optimalDistance: 3, maxDistance: 4, reloadActions: 0, canStoreLoaded: false, staminaCost: 2, accuracy: 0, armorPiercing: 0, compatibleAmmo: ["arrow", "armorPiercingArrow"] },
  longBow: { damageDice: "1d8", minDistance: 2, optimalDistance: 4, maxDistance: 5, reloadActions: 0, canStoreLoaded: false, staminaCost: 3, accuracy: 1, armorPiercing: 0, compatibleAmmo: ["arrow", "armorPiercingArrow"] },
  throwingWeapon: { damageDice: "1d4", minDistance: 1, optimalDistance: 2, maxDistance: 3, reloadActions: 0, canStoreLoaded: false, staminaCost: 1, accuracy: 0, armorPiercing: 0, compatibleAmmo: ["thrown"] },
};
