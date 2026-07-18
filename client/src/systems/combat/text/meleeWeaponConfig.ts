import type { AttackAttribute, DamageType, WeaponType } from "../../../types/combat";
import type { InventoryItem } from "../../../types/inventory";
import { isWeaponType } from "../combatValidation";
import type { AttackType, CombatDistance, MeleeWeaponCategory, WeaponCategory } from "./combatTextTypes";

export type MeleeTechnique =
  | "normal"
  | "quick"
  | "heavy"
  | "thrust"
  | "slash"
  | "bash"
  | "punch"
  | "kick"
  | "shove"
  | "grapple";

export type MeleeWeaponDefinition = {
  id: string;
  category: MeleeWeaponCategory;
  weaponTypes: WeaponType[];
  damageDice: string;
  damageType: DamageType;
  attackAttribute: AttackAttribute;
  staminaCost: number;
  allowedDistances: CombatDistance[];
  baseAttackTypes: AttackType[];
  techniques: MeleeTechnique[];
  requiresInventoryItem: boolean;
  requiresEquippedItem: boolean;
};

export const UNARMED_WEAPON_DEFINITION: MeleeWeaponDefinition = {
  id: "unarmed",
  category: "unarmed",
  weaponTypes: ["unarmed"],
  damageDice: "1d2",
  damageType: "bludgeoning",
  attackAttribute: "strength",
  staminaCost: 1,
  allowedDistances: ["grapple", "veryClose", "melee"],
  baseAttackTypes: ["punch", "kick", "bash"],
  techniques: ["normal", "punch", "kick", "shove", "grapple"],
  requiresInventoryItem: false,
  requiresEquippedItem: false,
};

export const meleeWeaponDefinitions: Record<MeleeWeaponCategory, MeleeWeaponDefinition> = {
  unarmed: UNARMED_WEAPON_DEFINITION,
  sword: {
    id: "sword",
    category: "sword",
    weaponTypes: ["oneHandedSword", "twoHandedSword"],
    damageDice: "1d6",
    damageType: "slashing",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["veryClose", "melee", "reach"],
    baseAttackTypes: ["slash", "thrust"],
    techniques: ["normal", "quick", "heavy", "slash", "thrust"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  dagger: {
    id: "dagger",
    category: "dagger",
    weaponTypes: ["dagger"],
    damageDice: "1d4",
    damageType: "piercing",
    attackAttribute: "dexterity",
    staminaCost: 1,
    allowedDistances: ["grapple", "veryClose", "melee"],
    baseAttackTypes: ["thrust", "slash"],
    techniques: ["normal", "quick", "thrust", "slash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  knife: {
    id: "knife",
    category: "knife",
    weaponTypes: ["dagger"],
    damageDice: "1d3",
    damageType: "piercing",
    attackAttribute: "dexterity",
    staminaCost: 1,
    allowedDistances: ["grapple", "veryClose", "melee"],
    baseAttackTypes: ["thrust", "slash"],
    techniques: ["normal", "quick", "thrust", "slash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  club: {
    id: "club",
    category: "club",
    weaponTypes: ["club"],
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["veryClose", "melee"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "heavy", "bash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  mace: {
    id: "mace",
    category: "mace",
    weaponTypes: ["mace"],
    damageDice: "1d6",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 3,
    allowedDistances: ["veryClose", "melee"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "heavy", "bash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  axe: {
    id: "axe",
    category: "axe",
    weaponTypes: ["axe"],
    damageDice: "1d6",
    damageType: "slashing",
    attackAttribute: "strength",
    staminaCost: 3,
    allowedDistances: ["melee"],
    baseAttackTypes: ["chop", "slash"],
    techniques: ["normal", "heavy", "slash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  spear: {
    id: "spear",
    category: "spear",
    weaponTypes: ["spear"],
    damageDice: "1d6",
    damageType: "piercing",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["melee", "reach"],
    baseAttackTypes: ["thrust"],
    techniques: ["normal", "thrust"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  staff: {
    id: "staff",
    category: "staff",
    weaponTypes: ["staff"],
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["veryClose", "melee", "reach"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "bash", "shove"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  hammer: {
    id: "hammer",
    category: "hammer",
    weaponTypes: ["mace"],
    damageDice: "1d8",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 4,
    allowedDistances: ["melee"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "heavy", "bash"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  shield: {
    id: "shield",
    category: "shield",
    weaponTypes: [],
    damageDice: "1d3",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["veryClose", "melee"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "bash", "shove"],
    requiresInventoryItem: true,
    requiresEquippedItem: true,
  },
  improvised: {
    id: "improvised",
    category: "improvised",
    weaponTypes: ["unarmed"],
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
    staminaCost: 2,
    allowedDistances: ["veryClose", "melee"],
    baseAttackTypes: ["bash"],
    techniques: ["normal", "bash"],
    requiresInventoryItem: false,
    requiresEquippedItem: false,
  },
};

export function toMeleeWeaponCategory(category?: WeaponCategory): MeleeWeaponCategory | undefined {
  if (!category) {
    return undefined;
  }

  if (category === "oneHandedSword" || category === "twoHandedSword") {
    return "sword";
  }

  if (
    category === "unarmed" ||
    category === "sword" ||
    category === "dagger" ||
    category === "knife" ||
    category === "club" ||
    category === "mace" ||
    category === "axe" ||
    category === "spear" ||
    category === "staff" ||
    category === "hammer" ||
    category === "shield" ||
    category === "improvised"
  ) {
    return category;
  }

  return undefined;
}

export function getMeleeWeaponDefinition(category?: WeaponCategory) {
  const meleeCategory = toMeleeWeaponCategory(category);

  return meleeCategory ? meleeWeaponDefinitions[meleeCategory] : undefined;
}

export function getMeleeCategoryFromInventoryItem(item?: InventoryItem | null): MeleeWeaponCategory | undefined {
  if (!item) {
    return undefined;
  }

  if (item.category === "shield") {
    return "shield";
  }

  if (!isWeaponType(item.weaponType)) {
    return undefined;
  }

  return toMeleeWeaponCategory(item.weaponType);
}

