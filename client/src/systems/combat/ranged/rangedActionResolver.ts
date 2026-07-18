import type { DamageType } from "../../../types/combat";
import type { NpcInstance } from "../../../types/npc";
import type { GameSave } from "../../save/saveSystem";
import { markResourceSpent } from "../../resources/resourceRegeneration";
import { normalizePlayerProgression } from "../../player/playerProgressionSystem";
import { getAttributeModifier, rollD20, rollDice } from "../diceSystem";
import { normalizeNpcCombatState } from "../combatSystem";
import { markNpcDefeatedAfterCombat } from "../postCombatSystem";
import { createDefaultPlayerTextCombatState, spendCombatStamina } from "../text/combatStamina";
import { getCombatInjuriesForHit } from "../text/combatInjuries";
import { getBodyZoneDifficulty, getZoneDamageModifier } from "../text/combatTargeting";
import { normalizeRangedCombatAction } from "./rangedActionNormalizer";
import { validateRangedCombatAction } from "./rangedActionValidator";
import { getAimModifier, getShotType, getStanceModifier, increaseAim } from "./rangedAiming";
import { getAmmoCategory, findAmmoForWeapon, spendAmmoItem } from "./rangedAmmo";
import { getCoverPenalty } from "./rangedCover";
import { shiftRangedDistance } from "./rangedDistance";
import { hasLineOfFire } from "./rangedLineOfFire";
import { advanceReloadState, markWeaponAfterShot } from "./rangedReload";
import {
  createDefaultPlayerRangedCombatState,
  getEquippedRangedWeapon,
  getWeaponState,
  normalizePlayerRangedCombatState,
  setWeaponState,
} from "./rangedWeaponState";
import { rangedWeaponConfig } from "./rangedCombatConfig";
import type {
  ParsedRangedAction,
  PlayerRangedCombatState,
  RangedCombatResolutionResult,
} from "./rangedCombatTypes";

function normalizeRangedState(save: GameSave): PlayerRangedCombatState {
  const equippedWeapon = getEquippedRangedWeapon(save);
  const equippedWeapons = equippedWeapon ? [equippedWeapon] : [];

  return normalizePlayerRangedCombatState(save.player.textCombat?.ranged ?? createDefaultPlayerRangedCombatState(), equippedWeapons);
}

function getShotDamageType(ammoCategory?: string): DamageType {
  if (ammoCategory === "fireBolt") {
    return "fire";
  }

  if (ammoCategory === "poisonBolt") {
    return "poison";
  }

  return "piercing";
}

export function resolveRangedCombatAction(
  save: GameSave,
  npcInstance: NpcInstance,
  rawAction: ParsedRangedAction,
): RangedCombatResolutionResult {
  const normalizedPlayer = normalizePlayerProgression(save.player, save.inventory);
  const textCombat = normalizedPlayer.textCombat ?? createDefaultPlayerTextCombatState(normalizedPlayer.derivedStats?.stamina ?? 10);
  const rangedState = normalizeRangedState({ ...save, player: { ...normalizedPlayer, textCombat } });
  const action = normalizeRangedCombatAction(rawAction);
  const nextDistance = shiftRangedDistance(textCombat.distance ?? "medium", action.movement);
  const baseSave: GameSave = {
    ...save,
    player: {
      ...normalizedPlayer,
      textCombat: {
        ...textCombat,
        ranged: rangedState,
        distance: nextDistance,
      },
    },
  };
  const validation = validateRangedCombatAction(baseSave, npcInstance, action, rangedState);
  const npcCombat = normalizeNpcCombatState(npcInstance.templateId, npcInstance.role, npcInstance.combat);

  if (!validation.ok) {
    return {
      ok: false,
      parsedAction: action,
      validation,
      save: baseSave,
      npcInstance: {
        ...npcInstance,
        combat: npcCombat,
      },
      staminaSpent: 0,
      ammunitionSpent: 0,
      distance: nextDistance,
      injuriesApplied: [],
      narrationHints: [validation.message],
    };
  }

  const weapon = validation.weapon;
  const weaponState = getWeaponState(rangedState, weapon);
  const currentAmmo = validation.ammo ?? findAmmoForWeapon(baseSave.inventory, validation.weaponCategory, action.ammoCategory);

  if (action.intent === "takeCover" || action.intent === "leaveCover" || action.intent === "aim" || action.intent === "reload" || action.intent === "cockWeapon" || action.intent === "loadAmmo" || action.intent === "changeAmmo") {
    let nextRangedState: PlayerRangedCombatState = {
      ...rangedState,
      cover: action.intent === "leaveCover" ? "none" : action.coverRequested ?? rangedState.cover,
      lastTargetId: action.targetId ?? rangedState.lastTargetId,
    };
    let nextInventory = baseSave.inventory;
    let nextWeaponState = weaponState;
    let ammunitionSpent = 0;
    const hints: string[] = [];

    if (action.intent === "aim") {
      nextWeaponState = {
        ...nextWeaponState,
        aimState: increaseAim(nextWeaponState.aimState, action),
      };
      hints.push("Герой тратит ход на прицеливание. Следующий выстрел будет точнее.");
    }

    if (action.intent === "takeCover") {
      hints.push("Герой занимает укрытие и усложняет ответный огонь.");
    }

    if (action.intent === "leaveCover") {
      hints.push("Герой выходит из укрытия и освобождает линию выстрела.");
    }

    if (action.intent === "reload" || action.intent === "cockWeapon" || action.intent === "loadAmmo" || action.intent === "changeAmmo") {
      const ammoCategory = currentAmmo ? getAmmoCategory(currentAmmo) : undefined;
      nextWeaponState = advanceReloadState(weapon, validation.weaponCategory, nextWeaponState, currentAmmo && ammoCategory ? { id: currentAmmo.id, category: ammoCategory } : undefined);

      if (nextWeaponState.loaded && currentAmmo) {
        nextInventory = spendAmmoItem(nextInventory, currentAmmo.id);
        ammunitionSpent = 1;
      }

      hints.push(nextWeaponState.loaded ? "Оружие заряжено и готово к выстрелу." : "Герой взводит оружие и продолжает перезарядку.");
    }

    nextRangedState = setWeaponState(nextRangedState, nextWeaponState);

    const spentTextCombat = spendCombatStamina(textCombat, validation.staminaCost);
    const nextSave: GameSave = markResourceSpent({
      ...baseSave,
      inventory: nextInventory,
      player: {
        ...baseSave.player,
        textCombat: {
          ...spentTextCombat,
          distance: nextDistance,
          ranged: nextRangedState,
        },
      },
    }, "stamina");

    return {
      ok: true,
      parsedAction: action,
      validation,
      save: nextSave,
      npcInstance: {
        ...npcInstance,
        combat: npcCombat,
      },
      staminaSpent: validation.staminaCost,
      ammunitionSpent,
      distance: nextDistance,
      injuriesApplied: [],
      narrationHints: hints,
    };
  }

  if (!hasLineOfFire(action, nextDistance)) {
    const blockedValidation = { ok: false as const, reason: "lineBlocked" as const, staminaCost: validation.staminaCost, distancePenalty: validation.distancePenalty, coverPenalty: validation.coverPenalty, message: "Линия выстрела перекрыта. Нужно сменить позицию или дистанцию." };

    return {
      ok: false,
      parsedAction: action,
      validation: blockedValidation,
      save: baseSave,
      npcInstance: { ...npcInstance, combat: npcCombat },
      staminaSpent: 0,
      ammunitionSpent: 0,
      distance: nextDistance,
      injuriesApplied: [],
      narrationHints: [blockedValidation.message],
    };
  }

  const weaponConfig = rangedWeaponConfig[validation.weaponCategory];
  const shotType = getShotType(action);
  const attackAttribute = weapon.attackAttribute ?? "dexterity";
  const attributeModifier = getAttributeModifier(normalizedPlayer.attributes[attackAttribute]);
  const proficiencyBonus = normalizedPlayer.training?.weapons[validation.weaponType] ? 2 : 0;
  const aimModifier = getAimModifier(weaponState.aimState, action);
  const stanceModifier = getStanceModifier(action.stance);
  const shotModifier = shotType === "power" ? -1 : shotType === "quick" || shotType === "snap" ? -2 : 0;
  const d20 = rollD20();
  const critical = d20 === 20;
  const fumble = d20 === 1;
  const attackTotal =
    d20 +
    attributeModifier +
    proficiencyBonus +
    weaponConfig.accuracy +
    aimModifier +
    stanceModifier +
    shotModifier -
    validation.distancePenalty -
    getCoverPenalty(rangedState.cover);
  const difficultyClass = Math.max(5, npcCombat.armorClass + getBodyZoneDifficulty(action.targetZone) - weaponConfig.armorPiercing);
  const hit = critical || (!fumble && attackTotal >= difficultyClass);
  const ammoCategory = weaponState.loadedAmmoCategory ?? getAmmoCategory(currentAmmo);
  const damageType = getShotDamageType(ammoCategory);
  const baseDamage = hit ? Math.max(1, rollDice(weapon.damageDice ?? weaponConfig.damageDice) + attributeModifier + getZoneDamageModifier(action.targetZone) + (shotType === "power" ? 2 : 0)) : 0;
  const damage = critical ? baseDamage * 2 : baseDamage;
  const injuries = hit
    ? getCombatInjuriesForHit({
        zone: action.targetZone,
        damage,
        critical,
        damageType,
      })
    : [];
  const nextNpcHealth = hit ? Math.max(0, npcCombat.currentHealth - damage) : npcCombat.currentHealth;
  const enemyDefeated = nextNpcHealth <= 0;
  const damagedNpcInstance: NpcInstance = {
    ...npcInstance,
    combat: {
      ...npcCombat,
      currentHealth: nextNpcHealth,
      isDefeated: enemyDefeated,
      damageType,
      lifeState: enemyDefeated ? (npcInstance.role === "monster" ? "dead" : "defeated") : npcCombat.lifeState,
    },
    textCombat: {
      ...(npcInstance.textCombat ?? {
        stance: "balanced",
        distance: nextDistance,
        balance: 0,
        injuries: [],
      }),
      distance: nextDistance,
      injuries: [...(npcInstance.textCombat?.injuries ?? []), ...injuries].slice(-12),
    },
  };
  const nextNpcInstance = enemyDefeated ? markNpcDefeatedAfterCombat(damagedNpcInstance, save.player.id) : damagedNpcInstance;
  const nextWeaponState = weaponConfig.reloadActions > 0
    ? markWeaponAfterShot(weaponState)
    : { ...weaponState, aimState: undefined, durability: Math.max(0, weaponState.durability - 1) };
  const ammunitionSpent = weaponConfig.reloadActions > 0 ? 0 : currentAmmo ? 1 : 0;
  const nextInventory = weaponConfig.reloadActions > 0 ? baseSave.inventory : spendAmmoItem(baseSave.inventory, currentAmmo?.id);
  const nextRangedState = setWeaponState(
    {
      ...rangedState,
      lastTargetId: npcInstance.instanceId,
    },
    nextWeaponState,
  );
  const spentTextCombat = spendCombatStamina(textCombat, validation.staminaCost);
  const nextSave: GameSave = markResourceSpent({
    ...baseSave,
    inventory: nextInventory,
    player: {
      ...baseSave.player,
      textCombat: {
        ...spentTextCombat,
        distance: nextDistance,
        ranged: nextRangedState,
      },
    },
  }, "stamina");
  const narrationHints = [
    hit
      ? `Попадание по зоне ${action.targetZone ?? "torso"}: ${damage} урона.`
      : fumble
        ? "Критическая ошибка: выстрел срывается."
        : "Выстрел не достигает цели.",
    ...(action.warnings.includes("claimedOutcome") ? ["Заявленный исход был намерением героя, результат определила система."] : []),
    ...injuries.map((injury) => `Травма: ${injury.type}${injury.zone ? ` (${injury.zone})` : ""}.`),
  ];

  return {
    ok: true,
    parsedAction: action,
    validation,
    save: nextSave,
    npcInstance: nextNpcInstance,
    d20,
    attackTotal,
    difficultyClass,
    hit,
    critical,
    fumble,
    damage,
    damageType,
    staminaSpent: validation.staminaCost,
    ammunitionSpent,
    distance: nextDistance,
    injuriesApplied: injuries,
    enemyDefeated,
    narrationHints,
  };
}
