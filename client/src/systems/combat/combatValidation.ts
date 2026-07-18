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
  "spear",
  "bow",
  "shortBow",
  "longBow",
  "handCrossbow",
  "lightCrossbow",
  "huntingCrossbow",
  "heavyCrossbow",
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
  if (action.type === "auto") {
    return getEquippedWeapon(save) ? validatePlayerCanAttack(save, { type: "weapon" }) : validatePlayerCanAttack(save, { type: "unarmed" });
  }

  if (action.type === "unarmed" || action.type === "kick" || action.type === "shove" || action.type === "grapple") {
    return {
      ok: true,
      weapon: {
        id: `virtual_${action.type}`,
        templateId: action.type,
        nameKey: action.type === "kick" ? "combat.kick" : action.type === "shove" ? "combat.shove" : action.type === "grapple" ? "combat.grapple" : "weapon.unarmed",
        descriptionKey: "weapon.unarmed",
        category: "weapon",
        rarity: "common",
        quantity: 1,
        weight: 0,
        value: 0,
        equippable: false,
        icon: "UN",
        weaponType: "unarmed",
        damageDice: action.type === "kick" ? "1d3" : action.type === "shove" || action.type === "grapple" ? "0d1" : "1d2",
        damageType: "bludgeoning",
        attackAttribute: "strength",
        createdAt: new Date(0).toISOString(),
      },
      weaponType: "unarmed",
    };
  }

  if (action.type === "throw_object" || action.type === "improvised") {
    if (!action.objectAvailable) {
      return { ok: false, reason: "noObjectToThrow" };
    }

    return {
      ok: true,
      weapon: {
        id: `virtual_${action.objectHint ?? "improvised"}`,
        templateId: action.objectHint ?? "improvised",
        nameKey: action.objectHint === "stone" ? "environment.stone" : "combat.improvisedAttack",
        descriptionKey: "combat.improvisedAttack",
        category: "weapon",
        rarity: "common",
        quantity: 1,
        weight: 0,
        value: 0,
        equippable: false,
        icon: "IM",
        weaponType: "unarmed",
        damageDice: action.objectHint === "stick" ? "1d4" : action.objectHint === "torch" ? "1d3" : "1d2",
        damageType: "bludgeoning",
        attackAttribute: action.type === "throw_object" ? "dexterity" : "strength",
        createdAt: new Date(0).toISOString(),
      },
      weaponType: "unarmed",
    };
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
