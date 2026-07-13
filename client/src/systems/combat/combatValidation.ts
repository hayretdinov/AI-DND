import type { GameSave } from "../save/saveSystem";
import type { CombatBlockedReason, PlayerAttackAction, WeaponType } from "../../types/combat";
import type { InventoryItem } from "../../types/inventory";

const WEAPON_TYPES = new Set<WeaponType>([
  "oneHandedSword",
  "twoHandedSword",
  "dagger",
  "axe",
  "mace",
  "club",
  "bow",
  "staff",
  "unarmed",
]);

export type CombatValidationResult =
  | { ok: true; weapon: InventoryItem; weaponType: WeaponType }
  | { ok: false; reason: CombatBlockedReason; weapon?: InventoryItem; weaponType?: WeaponType };

export function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === "string" && WEAPON_TYPES.has(value as WeaponType);
}

export function isWeaponItem(item: InventoryItem) {
  return item.category === "weapon" || isWeaponType(item.weaponType);
}

export function getEquippedWeapon(save: GameSave) {
  const inventory = save.inventory;

  if (!inventory) {
    return null;
  }

  const equippedIds = [
    inventory.equipment.mainHand,
    inventory.equipment.primaryWeapon,
    inventory.equipment.offHand,
    inventory.equipment.secondaryWeapon,
  ].filter(Boolean);

  return inventory.items.find((item) => equippedIds.includes(item.id) && isWeaponItem(item)) ?? null;
}

export function hasWeaponInInventory(save: GameSave) {
  return Boolean(save.inventory?.items.some(isWeaponItem));
}

export function validatePlayerCanAttack(save: GameSave, action: PlayerAttackAction = { type: "weapon" }): CombatValidationResult {
  if (action.type === "unarmed") {
    return save.player.training?.weapons.unarmed
      ? {
          ok: true,
          weapon: {
            id: "virtual_unarmed",
            templateId: "unarmed",
            nameKey: "weapon.unarmed",
            descriptionKey: "weapon.unarmed",
            category: "weapon",
            rarity: "common",
            quantity: 1,
            weight: 0,
            value: 0,
            equippable: false,
            icon: "UN",
            weaponType: "unarmed",
            damageDice: "1d4",
            damageType: "bludgeoning",
            attackAttribute: "strength",
            createdAt: new Date(0).toISOString(),
          },
          weaponType: "unarmed",
        }
      : { ok: false, reason: "notTrained", weaponType: "unarmed" };
  }

  const equippedWeapon = getEquippedWeapon(save);

  if (!equippedWeapon) {
    return { ok: false, reason: hasWeaponInInventory(save) ? "weaponNotEquipped" : "noWeapon" };
  }

  const weaponType = isWeaponType(equippedWeapon.weaponType) ? equippedWeapon.weaponType : undefined;

  if (!weaponType) {
    return { ok: false, reason: "notTrained", weapon: equippedWeapon };
  }

  if (!save.player.training?.weapons[weaponType]) {
    return { ok: false, reason: "notTrained", weapon: equippedWeapon, weaponType };
  }

  return { ok: true, weapon: equippedWeapon, weaponType };
}
