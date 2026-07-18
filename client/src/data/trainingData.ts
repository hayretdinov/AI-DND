import type { PlayerTraining, WeaponType } from "../types/combat";

export const WEAPON_TRAINING_ORDER: WeaponType[] = [
  "unarmed",
  "oneHandedSword",
  "twoHandedSword",
  "dagger",
  "axe",
  "mace",
  "club",
  "spear",
  "bow",
  "shortBow",
  "longBow",
  "handCrossbow",
  "lightCrossbow",
  "huntingCrossbow",
  "heavyCrossbow",
  "staff",
];

export function createDefaultPlayerTraining(): PlayerTraining {
  return {
    weapons: {
      unarmed: true,
      oneHandedSword: true,
      twoHandedSword: false,
      dagger: false,
      axe: false,
      mace: false,
      club: true,
      spear: false,
      bow: false,
      shortBow: false,
      longBow: false,
      handCrossbow: false,
      lightCrossbow: true,
      huntingCrossbow: false,
      heavyCrossbow: false,
      staff: false,
    },
    combat: {
      basicAttack: true,
      powerAttack: false,
      aimedAttack: false,
      parry: false,
      dodge: false,
    },
  };
}
