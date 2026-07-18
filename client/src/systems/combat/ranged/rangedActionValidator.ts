import type { GameSave } from "../../save/saveSystem";
import type { NpcInstance } from "../../../types/npc";
import { normalizePlayerProgression } from "../../player/playerProgressionSystem";
import { getAmmoCategory, findAmmoForWeapon } from "./rangedAmmo";
import { getCoverPenalty } from "./rangedCover";
import { getRangedDistancePenalty } from "./rangedDistance";
import { getEquippedRangedWeapon, getRangedWeaponCategory, getWeaponState } from "./rangedWeaponState";
import { rangedWeaponConfig } from "./rangedCombatConfig";
import type { ParsedRangedAction, PlayerRangedCombatState, RangedValidationResult } from "./rangedCombatTypes";

const NON_SHOT_INTENTS = new Set(["aim", "reload", "cockWeapon", "loadAmmo", "changeAmmo", "takeCover", "leaveCover", "closeDistance", "increaseDistance", "switchWeapon"]);
const SHOT_INTENTS = new Set(["shoot", "quickShot", "snapShot", "preciseShot", "powerShot", "leadingShot", "readyShot"]);

export function getRangedStaminaCost(action: ParsedRangedAction, weaponCategory?: string) {
  const shotCost = action.shotType === "power" ? 2 : action.shotType === "quick" || action.shotType === "snap" ? 1 : 2;
  const movementCost = action.movement === "none" ? 0 : 1;
  const reloadCost = action.intent === "reload" || action.intent === "cockWeapon" || action.intent === "loadAmmo" ? 1 : 0;
  const weaponCost = weaponCategory && weaponCategory.includes("heavy") ? 1 : 0;

  return Math.max(1, shotCost + movementCost + reloadCost + weaponCost);
}

export function validateRangedCombatAction(
  save: GameSave,
  npcInstance: NpcInstance,
  action: ParsedRangedAction,
  rangedState: PlayerRangedCombatState,
): RangedValidationResult {
  const normalizedPlayer = normalizePlayerProgression(save.player, save.inventory);
  const weapon = getEquippedRangedWeapon(save);
  const weaponCategory = getRangedWeaponCategory(weapon);
  const staminaCost = getRangedStaminaCost(action, weaponCategory);
  const currentDistance = normalizedPlayer.textCombat?.distance ?? "medium";
  const distancePenalty = weaponCategory ? getRangedDistancePenalty(weaponCategory, currentDistance) : 0;
  const coverPenalty = getCoverPenalty(rangedState.cover);

  if (action.intent === "unknown" || action.confidence < 0.35) {
    return { ok: false, reason: "notRangedCombat", staminaCost: 0, distancePenalty, coverPenalty, message: "Это не похоже на дальнобойное действие." };
  }

  if (action.isOverloaded) {
    return { ok: false, reason: "overloaded", staminaCost, distancePenalty, coverPenalty, message: "Действие слишком перегружено. Опиши один выстрел, перезарядку или перемещение." };
  }

  if (npcInstance.status !== "alive") {
    return { ok: false, reason: "npcDefeated", staminaCost: 0, distancePenalty, coverPenalty, message: "Цель уже не может продолжать бой." };
  }

  if (!weapon || !weaponCategory) {
    return { ok: false, reason: "noRangedWeapon", staminaCost, distancePenalty, coverPenalty, message: "У героя не экипировано дальнобойное оружие." };
  }

  if (action.weaponCategory && action.weaponCategory !== weaponCategory) {
    return { ok: false, reason: "weaponNotEquipped", staminaCost, distancePenalty, coverPenalty, message: "Указанное дальнобойное оружие не экипировано." };
  }

  if (normalizedPlayer.textCombat && normalizedPlayer.textCombat.stamina < staminaCost) {
    return { ok: false, reason: "notEnoughStamina", staminaCost, distancePenalty, coverPenalty, message: "Не хватает выносливости для этого выстрела." };
  }

  if (distancePenalty >= 6) {
    return { ok: false, reason: "wrongDistance", staminaCost, distancePenalty, coverPenalty, message: "Дистанция не подходит для выбранного оружия." };
  }

  const weaponState = getWeaponState(rangedState, weapon);
  const ammo = findAmmoForWeapon(save.inventory, weaponCategory, action.ammoCategory);
  const weaponConfig = rangedWeaponConfig[weaponCategory];

  if (SHOT_INTENTS.has(action.intent)) {
    if (weaponConfig.reloadActions > 0 && (!weaponState.loaded || !weaponState.cocked || weaponState.jammed)) {
      return { ok: false, reason: "notLoaded", staminaCost, distancePenalty, coverPenalty, message: "Оружие не готово к выстрелу. Сначала перезаряди его." };
    }

    if (weaponConfig.reloadActions <= 0 && !ammo && weaponCategory !== "throwingWeapon") {
      return { ok: false, reason: "noAmmo", staminaCost, distancePenalty, coverPenalty, message: "Нет подходящих стрел или болтов." };
    }
  }

  if (NON_SHOT_INTENTS.has(action.intent) && (action.intent === "reload" || action.intent === "loadAmmo" || action.intent === "changeAmmo") && !ammo) {
    return { ok: false, reason: "noAmmo", staminaCost, distancePenalty, coverPenalty, message: "Нет подходящих боеприпасов для перезарядки." };
  }

  if (ammo && !weaponConfig.compatibleAmmo.includes(getAmmoCategory(ammo)!)) {
    return { ok: false, reason: "wrongAmmo", staminaCost, distancePenalty, coverPenalty, message: "Этот боеприпас не подходит к оружию." };
  }

  return {
    ok: true,
    weapon,
    ammo,
    weaponType: weapon.weaponType ?? "bow",
    weaponCategory,
    staminaCost,
    distancePenalty,
    coverPenalty,
  };
}
