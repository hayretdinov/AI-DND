import type { InventoryItem } from "../../../types/inventory";
import { rangedWeaponConfig } from "./rangedCombatConfig";
import type { AmmoCategory, RangedWeaponCategory, RangedWeaponState } from "./rangedCombatTypes";

export function advanceReloadState(
  weapon: InventoryItem,
  weaponCategory: RangedWeaponCategory,
  state: RangedWeaponState,
  ammo?: { id: string; category: AmmoCategory },
): RangedWeaponState {
  const config = rangedWeaponConfig[weaponCategory];
  const nextProgress = state.reloadProgress + 1;

  if (config.reloadActions <= 0) {
    return {
      ...state,
      loaded: true,
      cocked: true,
      loadedAmmoItemId: ammo?.id,
      loadedAmmoCategory: ammo?.category,
      reloadStage: "loaded",
      reloadProgress: 0,
      aimState: undefined,
    };
  }

  if (!state.cocked) {
    return {
      ...state,
      weaponId: weapon.id,
      cocked: true,
      reloadStage: config.reloadActions > 1 ? "cocking" : "cocked",
      reloadProgress: nextProgress >= config.reloadActions ? 0 : nextProgress,
      aimState: undefined,
    };
  }

  return {
    ...state,
    weaponId: weapon.id,
    loaded: true,
    cocked: true,
    loadedAmmoItemId: ammo?.id,
    loadedAmmoCategory: ammo?.category,
    reloadStage: "loaded",
    reloadProgress: 0,
    aimState: undefined,
  };
}

export function markWeaponAfterShot(state: RangedWeaponState): RangedWeaponState {
  return {
    ...state,
    loaded: false,
    cocked: false,
    loadedAmmoItemId: undefined,
    loadedAmmoCategory: undefined,
    reloadStage: "uncocked",
    reloadProgress: 0,
    durability: Math.max(0, state.durability - 1),
    aimState: undefined,
  };
}
