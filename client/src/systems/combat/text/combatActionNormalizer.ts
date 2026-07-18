import type { InventoryItem } from "../../../types/inventory";
import type { ParsedCombatAction, WeaponCategory } from "./combatTextTypes";
import { getEquippedWeapon, isWeaponType } from "../combatValidation";
import type { GameSave } from "../../save/saveSystem";
import { getMeleeCategoryFromInventoryItem, toMeleeWeaponCategory } from "./meleeWeaponConfig";

function categoryFromWeapon(item?: InventoryItem | null): WeaponCategory | undefined {
  if (!item) {
    return undefined;
  }

  if (isWeaponType(item.weaponType)) {
    return item.weaponType;
  }

  if (item.category === "shield") {
    return "shield";
  }

  return undefined;
}

function isExplicitUnarmed(action: ParsedCombatAction) {
  return (
    action.weaponCategory === "unarmed" ||
    action.attackType === "punch" ||
    action.attackType === "kick" ||
    action.intent === "shove" ||
    action.intent === "grapple"
  );
}

function getEquippedItems(save: GameSave) {
  const inventory = save.inventory;

  if (!inventory) {
    return [];
  }

  const equippedIds = [
    inventory.equipment.mainHand,
    inventory.equipment.primaryWeapon,
    inventory.equipment.offHand,
    inventory.equipment.secondaryWeapon,
    inventory.equipment.shield,
  ].filter(Boolean);

  return inventory.items.filter((item) => equippedIds.includes(item.id));
}

function findEquippedItemForCategory(save: GameSave, category: WeaponCategory | undefined) {
  const requestedCategory = toMeleeWeaponCategory(category);

  if (!requestedCategory) {
    return undefined;
  }

  return getEquippedItems(save).find((item) => getMeleeCategoryFromInventoryItem(item) === requestedCategory);
}

export function normalizeTextCombatAction(save: GameSave, action: ParsedCombatAction): ParsedCombatAction {
  const equippedWeapon = getEquippedWeapon(save);
  const explicitItem = isExplicitUnarmed(action) ? undefined : findEquippedItemForCategory(save, action.weaponCategory);
  const resolvedItem = explicitItem ?? (isExplicitUnarmed(action) ? undefined : equippedWeapon);
  const inferredWeaponCategory = action.weaponCategory ?? categoryFromWeapon(resolvedItem) ?? "unarmed";
  const attackType =
    action.attackType ??
    (inferredWeaponCategory === "dagger" || inferredWeaponCategory === "knife" || inferredWeaponCategory === "spear" ? "thrust" :
      inferredWeaponCategory === "axe" ? "chop" :
      inferredWeaponCategory === "mace" || inferredWeaponCategory === "club" || inferredWeaponCategory === "staff" || inferredWeaponCategory === "hammer" || inferredWeaponCategory === "shield" ? "bash" :
      inferredWeaponCategory === "unarmed" ? "punch" :
      "slash");

  return {
    ...action,
    weaponId: isExplicitUnarmed(action) ? "unarmed" : resolvedItem?.id ?? action.weaponId,
    weaponCategory: inferredWeaponCategory,
    attackType,
    targetZone: action.targetZone ?? "torso",
    requestedDistance:
      action.requestedDistance ??
      (action.movement === "stepForward" || action.movement === "lunge" || action.movement === "rush" ? "melee" : undefined),
  };
}
