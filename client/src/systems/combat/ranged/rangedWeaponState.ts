import type { InventoryItem } from "../../../types/inventory";
import type {
  PlayerRangedCombatState,
  RangedWeaponCategory,
  RangedWeaponState,
} from "./rangedCombatTypes";

export function createDefaultPlayerRangedCombatState(): PlayerRangedCombatState {
  return {
    weapons: {},
    cover: "none",
  };
}

export function createDefaultRangedWeaponState(weapon: InventoryItem): RangedWeaponState {
  const category = getRangedWeaponCategory(weapon);

  return {
    weaponId: weapon.id,
    loaded: false,
    cocked: category?.includes("Crossbow") ? false : true,
    reloadStage: category?.includes("Crossbow") ? "uncocked" : "ready",
    reloadProgress: 0,
    durability: 100,
    jammed: false,
  };
}

export function getRangedWeaponCategory(weapon?: InventoryItem | null): RangedWeaponCategory | undefined {
  if (!weapon?.weaponType) {
    return undefined;
  }

  if (
    weapon.weaponType === "handCrossbow" ||
    weapon.weaponType === "lightCrossbow" ||
    weapon.weaponType === "huntingCrossbow" ||
    weapon.weaponType === "heavyCrossbow" ||
    weapon.weaponType === "shortBow" ||
    weapon.weaponType === "longBow"
  ) {
    return weapon.weaponType;
  }

  if (weapon.weaponType === "bow") {
    return "shortBow";
  }

  return undefined;
}

export function getEquippedRangedWeapon(save: { inventory?: { items: InventoryItem[]; equipment: Record<string, string | undefined> } }) {
  const equipment = save.inventory?.equipment;
  const equippedId = equipment?.rangedWeapon ?? equipment?.primaryWeapon ?? equipment?.mainHand;

  if (!equippedId) {
    return undefined;
  }

  return save.inventory?.items.find((item) => item.id === equippedId || item.instanceId === equippedId);
}

export function normalizeRangedWeaponState(weapon: InventoryItem, state?: Partial<RangedWeaponState>): RangedWeaponState {
  const fallback = createDefaultRangedWeaponState(weapon);

  return {
    ...fallback,
    ...(state ?? {}),
    weaponId: typeof state?.weaponId === "string" ? state.weaponId : fallback.weaponId,
    loaded: Boolean(state?.loaded ?? fallback.loaded),
    cocked: Boolean(state?.cocked ?? fallback.cocked),
    reloadProgress: Number.isFinite(state?.reloadProgress) ? Math.max(0, Math.floor(Number(state?.reloadProgress))) : fallback.reloadProgress,
    durability: Number.isFinite(state?.durability) ? Math.max(0, Math.min(100, Number(state?.durability))) : fallback.durability,
    jammed: Boolean(state?.jammed ?? fallback.jammed),
  };
}

export function normalizePlayerRangedCombatState(
  state: Partial<PlayerRangedCombatState> | undefined,
  equippedWeapons: InventoryItem[] = [],
): PlayerRangedCombatState {
  const weapons: PlayerRangedCombatState["weapons"] = {};

  for (const weapon of equippedWeapons) {
    if (!getRangedWeaponCategory(weapon)) {
      continue;
    }

    weapons[weapon.id] = normalizeRangedWeaponState(weapon, state?.weapons?.[weapon.id]);
  }

  return {
    weapons: {
      ...(state?.weapons ?? {}),
      ...weapons,
    },
    cover: state?.cover === "partial" || state?.cover === "half" || state?.cover === "full" ? state.cover : "none",
    lastTargetId: typeof state?.lastTargetId === "string" ? state.lastTargetId : undefined,
  };
}

export function getWeaponState(rangedState: PlayerRangedCombatState, weapon: InventoryItem): RangedWeaponState {
  return normalizeRangedWeaponState(weapon, rangedState.weapons[weapon.id]);
}

export function setWeaponState(
  rangedState: PlayerRangedCombatState,
  weaponState: RangedWeaponState,
): PlayerRangedCombatState {
  return {
    ...rangedState,
    weapons: {
      ...rangedState.weapons,
      [weaponState.weaponId]: weaponState,
    },
  };
}
