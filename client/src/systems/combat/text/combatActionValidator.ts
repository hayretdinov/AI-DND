import type { GameSave } from "../../save/saveSystem";
import type { NpcInstance } from "../../../types/npc";
import type { InventoryItem } from "../../../types/inventory";
import { getEquippedWeapon, isWeaponType, validatePlayerCanAttack } from "../combatValidation";
import { getWeaponDistancePenalty, shiftDistance } from "./combatDistance";
import { getCombatStaminaCost } from "./combatStamina";
import { getMeleeWeaponDefinition, getMeleeCategoryFromInventoryItem, toMeleeWeaponCategory } from "./meleeWeaponConfig";
import type { ParsedCombatAction, TextCombatValidationResult, WeaponCategory } from "./combatTextTypes";

const DEFENSIVE_INTENTS = new Set(["defend", "block", "parry", "dodge", "guard", "readyAction", "holdDistance"]);
const ATTACK_INTENTS = new Set(["attack", "weaponStrike", "counterattack", "feint", "disarm", "trip", "shove", "grapple", "shieldBash", "pommelStrike", "breakGuard", "throwWeapon"]);

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

function findEquippedWeaponForCategory(save: GameSave, category: WeaponCategory | undefined): InventoryItem | undefined {
  const meleeCategory = toMeleeWeaponCategory(category);

  if (!meleeCategory) {
    return undefined;
  }

  return getEquippedItems(save).find((item) => getMeleeCategoryFromInventoryItem(item) === meleeCategory);
}

function isUnarmedAction(action: ParsedCombatAction) {
  return (
    action.weaponCategory === "unarmed" ||
    action.attackType === "punch" ||
    action.attackType === "kick" ||
    action.intent === "shove" ||
    action.intent === "grapple"
  );
}

export function validateTextCombatAction(save: GameSave, npcInstance: NpcInstance, action: ParsedCombatAction): TextCombatValidationResult {
  const playerTextCombat = save.player.textCombat;
  const currentDistance = playerTextCombat?.distance ?? "melee";
  const resolvedDistance = shiftDistance(currentDistance, action.movement, action.requestedDistance);
  const requestedMeleeCategory = toMeleeWeaponCategory(action.weaponCategory);
  const weaponDefinition = getMeleeWeaponDefinition(requestedMeleeCategory);
  const distancePenalty = getWeaponDistancePenalty(requestedMeleeCategory ?? action.weaponCategory, resolvedDistance);
  const staminaCost = getCombatStaminaCost({
    power: action.power,
    tempo: action.tempo,
    movement: action.movement,
    techniqueId: action.techniqueId,
    weaponCategory: action.weaponCategory,
    attackType: action.attackType,
  });

  if (action.intent === "unknown" || action.confidence < 0.35) {
    return { ok: false, reason: "notCombat", staminaCost: 0, distancePenalty, message: "Это не похоже на боевое действие." };
  }

  if (action.isOverloaded) {
    return { ok: false, reason: "overloaded", staminaCost, distancePenalty, message: "Действие слишком перегружено. Сформулируй один основной прием." };
  }

  if (npcInstance.status !== "alive") {
    return { ok: false, reason: "npcDefeated", staminaCost: 0, distancePenalty, message: "Противник уже не может продолжать бой." };
  }

  if (playerTextCombat && playerTextCombat.stamina < staminaCost) {
    return { ok: false, reason: "notEnoughStamina", staminaCost, distancePenalty, message: "Не хватает выносливости для такого приема." };
  }

  if (DEFENSIVE_INTENTS.has(action.intent) || action.intent === "closeDistance" || action.intent === "increaseDistance") {
    return { ok: true, weaponCategory: requestedMeleeCategory, staminaCost: Math.max(1, Math.floor(staminaCost / 2)), distancePenalty };
  }

  if (!ATTACK_INTENTS.has(action.intent)) {
    return { ok: false, reason: "unknownAction", staminaCost, distancePenalty, message: "Система не распознала боевой прием." };
  }

  const legacyAction = isUnarmedAction(action)
    ? { type: action.attackType === "kick" ? "kick" as const : "unarmed" as const }
    : { type: "weapon" as const };
  const legacyValidation = isUnarmedAction(action) ? validatePlayerCanAttack(save, legacyAction) : undefined;

  if (legacyValidation && !legacyValidation.ok) {
    const messageByReason: Record<string, string> = {
      noWeapon: "У героя нет оружия для такого удара.",
      weaponNotEquipped: "Подходящее оружие не экипировано.",
      notTrained: "Герой не обучен владеть этим оружием.",
      noObjectToThrow: "Рядом нет подходящего предмета для броска.",
      invalidAction: "Такой удар сейчас невозможен.",
    };

    return {
      ok: false,
      reason: legacyValidation.reason,
      staminaCost,
      distancePenalty,
      message: messageByReason[legacyValidation.reason] ?? "Действие невозможно.",
    };
  }

  let resolvedWeapon = legacyValidation?.ok ? legacyValidation.weapon : undefined;
  let weaponType = legacyValidation?.ok ? legacyValidation.weaponType : undefined;
  let resolvedMeleeCategory = requestedMeleeCategory;

  if (!isUnarmedAction(action)) {
    const explicitCategory = action.weaponCategory;
    const equippedForCategory = findEquippedWeaponForCategory(save, explicitCategory);
    const fallbackEquipped = explicitCategory ? undefined : getEquippedWeapon(save) ?? undefined;

    resolvedWeapon = equippedForCategory ?? fallbackEquipped;

    if (!resolvedWeapon) {
      return {
        ok: false,
        reason: "weaponNotEquipped",
        staminaCost,
        distancePenalty,
        message: explicitCategory ? "Подходящее оружие не экипировано." : "У героя нет оружия в руках.",
      };
    }

    weaponType = isWeaponType(resolvedWeapon.weaponType) ? resolvedWeapon.weaponType : undefined;
    resolvedMeleeCategory = requestedMeleeCategory ?? getMeleeCategoryFromInventoryItem(resolvedWeapon);

    if (resolvedWeapon.category !== "shield" && !weaponType) {
      return { ok: false, reason: "notTrained", staminaCost, distancePenalty, message: "Система не знает тип этого оружия." };
    }

    if (weaponType && weaponType !== "unarmed" && !save.player.training?.weapons[weaponType]) {
      return { ok: false, reason: "notTrained", staminaCost, distancePenalty, message: "Герой не обучен владеть этим оружием." };
    }
  }

  if (distancePenalty >= 4) {
    return { ok: false, reason: "wrongDistance", staminaCost, distancePenalty, message: "Дистанция не подходит для выбранного оружия." };
  }

  if (weaponDefinition && !weaponDefinition.allowedDistances.includes(resolvedDistance)) {
    return { ok: false, reason: "wrongDistance", staminaCost, distancePenalty, message: "Дистанция не подходит для выбранного оружия." };
  }

  return {
    ok: true,
    weapon: resolvedWeapon,
    weaponType,
    weaponCategory: resolvedMeleeCategory,
    staminaCost,
    distancePenalty,
  };
}
