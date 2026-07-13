export type WeaponType =
  | "oneHandedSword"
  | "twoHandedSword"
  | "dagger"
  | "axe"
  | "mace"
  | "club"
  | "bow"
  | "staff"
  | "unarmed";

export type DamageType = "slashing" | "piercing" | "bludgeoning";
export type AttackAttribute = "strength" | "dexterity";

export type CombatStats = {
  maxHealth: number;
  currentHealth: number;
  armorClass: number;
  initiative: number;
  attackBonus: number;
  defenseBonus: number;
};

export type WeaponTraining = Record<WeaponType, boolean>;

export type CombatTraining = {
  basicAttack: boolean;
  powerAttack: boolean;
  aimedAttack: boolean;
  parry: boolean;
  dodge: boolean;
};

export type PlayerTraining = {
  weapons: WeaponTraining;
  combat: CombatTraining;
};

export type NpcCombatState = {
  maxHealth: number;
  currentHealth: number;
  armorClass: number;
  attackBonus: number;
  damageDice: string;
  damageType: DamageType;
  isDefeated: boolean;
};

export type PlayerAttackAction = {
  type: "weapon" | "unarmed";
};

export type CombatBlockedReason = "noWeapon" | "weaponNotEquipped" | "notTrained";
