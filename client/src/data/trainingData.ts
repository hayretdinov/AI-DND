import type { PlayerTraining, WeaponType } from "../types/combat";

export const WEAPON_TRAINING_ORDER: WeaponType[] = [
  "unarmed",
  "oneHandedSword",
  "twoHandedSword",
  "dagger",
  "axe",
  "mace",
  "club",
  "bow",
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
      bow: false,
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
