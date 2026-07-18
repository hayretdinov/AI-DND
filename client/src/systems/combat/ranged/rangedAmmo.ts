import type { InventoryItem, InventoryState } from "../../../types/inventory";
import type { AmmoCategory, RangedWeaponCategory } from "./rangedCombatTypes";
import { rangedWeaponConfig } from "./rangedCombatConfig";

const AMMO_BY_TEMPLATE: Record<string, AmmoCategory> = {
  common_crossbow_bolt: "commonBolt",
  simple_arrows: "arrow",
  armor_piercing_arrows: "armorPiercingArrow",
};

export function getAmmoCategory(item: InventoryItem | undefined): AmmoCategory | undefined {
  if (!item) {
    return undefined;
  }

  return AMMO_BY_TEMPLATE[item.templateId] ?? AMMO_BY_TEMPLATE[item.itemId ?? ""];
}

export function findAmmoForWeapon(inventory: InventoryState | undefined, weaponCategory: RangedWeaponCategory, requested?: AmmoCategory) {
  const compatibleAmmo = rangedWeaponConfig[weaponCategory].compatibleAmmo;

  return inventory?.items.find((item) => {
    if (item.quantity <= 0) {
      return false;
    }

    const ammoCategory = getAmmoCategory(item);

    if (!ammoCategory || !compatibleAmmo.includes(ammoCategory)) {
      return false;
    }

    return requested ? ammoCategory === requested : true;
  });
}

export function spendAmmoItem(inventory: InventoryState | undefined, ammoItemId?: string): InventoryState | undefined {
  if (!inventory || !ammoItemId) {
    return inventory;
  }

  return {
    ...inventory,
    items: inventory.items
      .map((item) =>
        item.id === ammoItemId || item.instanceId === ammoItemId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item,
      )
      .filter((item) => item.quantity > 0),
  };
}
