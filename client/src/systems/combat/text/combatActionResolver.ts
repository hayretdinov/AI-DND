import type { DamageType } from "../../../types/combat";
import type { NpcInstance } from "../../../types/npc";
import type { GameSave } from "../../save/saveSystem";
import { markResourceSpent } from "../../resources/resourceRegeneration";
import { normalizePlayerProgression } from "../../player/playerProgressionSystem";
import { getAttributeModifier, rollD20, rollDice } from "../diceSystem";
import { resolveEffectivePlayerStats } from "../../player/effectivePlayerStats";
import { normalizeNpcCombatState } from "../combatSystem";
import { markNpcDefeatedAfterCombat } from "../postCombatSystem";
import { shiftDistance } from "./combatDistance";
import { getCombatInjuriesForHit } from "./combatInjuries";
import { normalizeTextCombatAction } from "./combatActionNormalizer";
import { validateTextCombatAction } from "./combatActionValidator";
import { createDefaultPlayerTextCombatState, spendCombatStamina } from "./combatStamina";
import { getBodyZoneDifficulty, getDamageTypeForAttack, getZoneDamageModifier } from "./combatTargeting";
import { getMeleeWeaponDefinition } from "./meleeWeaponConfig";
import type {
  CombatDistance,
  CombatStance,
  NpcTextCombatState,
  ParsedCombatAction,
  PlayerTextCombatState,
  TextCombatResolutionResult,
} from "./combatTextTypes";

function normalizePlayerTextCombatState(state: PlayerTextCombatState | undefined, maxStamina: number): PlayerTextCombatState {
  const fallback = createDefaultPlayerTextCombatState(maxStamina);

  return {
    ...fallback,
    ...(state ?? {}),
    maxStamina: Math.max(1, Math.floor(state?.maxStamina ?? fallback.maxStamina)),
    stamina: Math.min(Math.max(1, Math.floor(state?.maxStamina ?? fallback.maxStamina)), Math.max(0, Math.floor(state?.stamina ?? fallback.stamina))),
    injuries: Array.isArray(state?.injuries) ? state.injuries : [],
    knownTechniques: Array.isArray(state?.knownTechniques) && state.knownTechniques.length > 0 ? state.knownTechniques : fallback.knownTechniques,
  };
}

function normalizeNpcTextCombatState(state: NpcTextCombatState | undefined, distance: CombatDistance): NpcTextCombatState {
  return {
    stance: state?.stance ?? "balanced",
    distance: state?.distance ?? distance,
    balance: Number.isFinite(state?.balance) ? Number(state?.balance) : 0,
    injuries: Array.isArray(state?.injuries) ? state.injuries : [],
    telegraphedAction: state?.telegraphedAction,
  };
}

function getStanceModifier(stance: CombatStance, mode: "attack" | "defense") {
  if (stance === "aggressive") {
    return mode === "attack" ? 1 : -1;
  }

  if (stance === "defensive" || stance === "guardHigh" || stance === "guardLow") {
    return mode === "defense" ? 1 : -1;
  }

  if (stance === "mobile") {
    return mode === "defense" ? 1 : 0;
  }

  return 0;
}

function getPowerModifier(power: ParsedCombatAction["power"]) {
  if (power === "light") {
    return { attack: 1, damage: -1 };
  }

  if (power === "heavy") {
    return { attack: -1, damage: 2 };
  }

  if (power === "allOut") {
    return { attack: -2, damage: 4 };
  }

  return { attack: 0, damage: 0 };
}

function getDefensiveStance(action: ParsedCombatAction, current: CombatStance): CombatStance {
  if (action.intent === "dodge" || action.movement === "stepBack" || action.movement === "circle") {
    return "mobile";
  }

  if (action.intent === "block" || action.intent === "parry" || action.intent === "guard") {
    return action.targetZone === "leftLeg" || action.targetZone === "rightLeg" ? "guardLow" : "guardHigh";
  }

  return current;
}

export function resolveTextCombatAction(save: GameSave, npcInstance: NpcInstance, rawAction: ParsedCombatAction): TextCombatResolutionResult {
  const normalizedPlayer = normalizePlayerProgression(save.player, save.inventory);
  const maxStamina = normalizedPlayer.derivedStats?.stamina ?? normalizedPlayer.textCombat?.maxStamina ?? 10;
  const playerTextCombat = normalizePlayerTextCombatState(normalizedPlayer.textCombat, maxStamina);
  const baseSave: GameSave = {
    ...save,
    player: {
      ...normalizedPlayer,
      textCombat: playerTextCombat,
    },
  };
  const action = normalizeTextCombatAction(baseSave, rawAction);
  const currentDistance = playerTextCombat.distance;
  const nextDistance = shiftDistance(currentDistance, action.movement, action.requestedDistance);
  const npcCombat = normalizeNpcCombatState(npcInstance.templateId, npcInstance.role, npcInstance.combat);
  const npcTextCombat = normalizeNpcTextCombatState(npcInstance.textCombat, nextDistance);
  const validation = validateTextCombatAction(baseSave, npcInstance, action);

  if (!validation.ok) {
    return {
      ok: false,
      parsedAction: action,
      validation,
      save: baseSave,
      npcInstance: {
        ...npcInstance,
        combat: npcCombat,
        textCombat: npcTextCombat,
      },
      staminaSpent: 0,
      distance: nextDistance,
      playerStance: playerTextCombat.stance,
      npcStance: npcTextCombat.stance,
      injuriesApplied: [],
      enemyReaction: "none",
      narrationHints: [validation.message],
    };
  }

  const staminaSpent = validation.staminaCost;
  let nextPlayerTextCombat = {
    ...spendCombatStamina(playerTextCombat, staminaSpent),
    distance: nextDistance,
  };
  const defensiveOnly = action.intent === "defend" || action.intent === "block" || action.intent === "parry" || action.intent === "dodge" || action.intent === "guard" || action.intent === "readyAction";

  if (defensiveOnly) {
    nextPlayerTextCombat = {
      ...nextPlayerTextCombat,
      stance: getDefensiveStance(action, nextPlayerTextCombat.stance),
    };

    const nextSave = markResourceSpent({
      ...baseSave,
      player: {
        ...baseSave.player,
        textCombat: nextPlayerTextCombat,
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
        textCombat: {
          ...npcTextCombat,
          distance: nextDistance,
        },
      },
      staminaSpent,
      distance: nextDistance,
      playerStance: nextPlayerTextCombat.stance,
      npcStance: npcTextCombat.stance,
      injuriesApplied: [],
      enemyReaction: "guard",
      narrationHints: ["Герой занимает защитную позицию и готовится к следующему обмену."],
    };
  }

  const weapon = validation.weapon;
  const weaponDefinition = getMeleeWeaponDefinition(action.weaponCategory);
  const attackAttribute = weaponDefinition?.attackAttribute ?? weapon?.attackAttribute ?? "strength";
  const attributeModifier = getAttributeModifier(resolveEffectivePlayerStats(normalizedPlayer, save.inventory)[attackAttribute]);
  const proficiencyBonus = validation.weaponType && validation.weaponType !== "unarmed" && normalizedPlayer.training?.weapons[validation.weaponType] ? 2 : 0;
  const targetZoneDifficulty = getBodyZoneDifficulty(action.targetZone);
  const powerModifier = getPowerModifier(action.power);
  const stanceModifier = getStanceModifier(playerTextCombat.stance, "attack");
  const d20 = rollD20();
  const critical = d20 === 20;
  const fumble = d20 === 1;
  const attackTotal = d20 + attributeModifier + proficiencyBonus + powerModifier.attack + stanceModifier - validation.distancePenalty;
  const difficultyClass = npcCombat.armorClass + targetZoneDifficulty + getStanceModifier(npcTextCombat.stance, "defense");
  const hit = critical || (!fumble && attackTotal >= difficultyClass);
  const causesDamage = action.intent !== "shove" && action.intent !== "grapple";
  const baseDice = weaponDefinition?.damageDice ?? weapon?.damageDice ?? (action.attackType === "kick" ? "1d3" : action.attackType === "punch" ? "1d2" : "1d4");
  const resolvedDamageType = (weaponDefinition?.damageType ?? weapon?.damageType ?? getDamageTypeForAttack(action.attackType)) as DamageType;
  const baseDamage = hit && causesDamage ? Math.max(1, rollDice(baseDice) + attributeModifier + powerModifier.damage + getZoneDamageModifier(action.targetZone)) : 0;
  const damage = critical ? baseDamage * 2 : baseDamage;
  const injuries = hit
    ? [
        ...(causesDamage
          ? getCombatInjuriesForHit({
              zone: action.targetZone,
              damage,
              critical,
              damageType: resolvedDamageType,
            })
          : []),
        ...(action.intent === "grapple"
          ? [{
              id: `grappled_${Date.now()}`,
              type: "grappled" as const,
              zone: action.targetZone,
              severity: "minor" as const,
              remainingTurns: 1,
              persistent: false,
              source: action.weaponCategory ?? "unarmed",
            }]
          : []),
      ]
    : [];
  const nextNpcHealth = hit ? Math.max(0, npcCombat.currentHealth - damage) : npcCombat.currentHealth;
  const enemyDefeated = nextNpcHealth <= 0;
  const damagedNpcInstance: NpcInstance = {
    ...npcInstance,
    combat: {
      ...npcCombat,
      currentHealth: nextNpcHealth,
      damageType: resolvedDamageType,
      isDefeated: enemyDefeated,
      lifeState: enemyDefeated ? (npcInstance.role === "monster" ? "dead" : "defeated") : npcCombat.lifeState,
    },
    textCombat: {
      ...npcTextCombat,
      distance: nextDistance,
      injuries: [...npcTextCombat.injuries, ...injuries].slice(-12),
      balance: hit && action.power !== "light" ? Math.max(-3, npcTextCombat.balance - 1) : npcTextCombat.balance,
    },
  };
  const nextNpcInstance = enemyDefeated ? markNpcDefeatedAfterCombat(damagedNpcInstance, save.player.id) : damagedNpcInstance;
  const saveAfterPlayer = {
    ...baseSave,
    player: {
      ...baseSave.player,
      textCombat: nextPlayerTextCombat,
    },
  };
  const nextSave = markResourceSpent(saveAfterPlayer, "stamina");
  const narrationHints = [
    hit
      ? `Попадание по зоне ${action.targetZone ?? "torso"}: ${damage} урона.`
      : fumble
        ? "Критическая ошибка: атака срывается."
        : "Атака не проходит защиту противника.",
    ...(action.warnings.includes("claimedOutcome") ? ["Заявленное отсечение или убийство было намерением героя, а не гарантированным результатом."] : []),
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
    damageType: resolvedDamageType,
    staminaSpent,
    distance: nextDistance,
    playerStance: nextPlayerTextCombat.stance,
    npcStance: npcTextCombat.stance,
    injuriesApplied: injuries,
    enemyDefeated,
    enemyReaction: enemyDefeated ? "none" : hit ? "stagger" : "guard",
    narrationHints,
  };
}
