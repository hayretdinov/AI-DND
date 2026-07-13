import type { GameSave } from "../save/saveSystem";
import type { CombatBlockedReason, DamageType, NpcCombatState, PlayerAttackAction } from "../../types/combat";
import type { NpcInstance, NpcRole } from "../../types/npc";
import { getAttributeModifier, rollD20, rollDice } from "./diceSystem";
import { validatePlayerCanAttack } from "./combatValidation";
import { normalizePlayerProgression } from "../player/playerProgressionSystem";

type EnemyAttackResult = {
  d20: number;
  attackTotal: number;
  hit: boolean;
  damage: number;
  barelyStanding: boolean;
};

export type PlayerAttackResult = {
  ok: boolean;
  blockedReason?: CombatBlockedReason;
  save: GameSave;
  npcInstance: NpcInstance;
  d20?: number;
  attackTotal?: number;
  hit?: boolean;
  critical?: boolean;
  damage?: number;
  enemyDefeated?: boolean;
  enemyAttack?: EnemyAttackResult;
};

function getDefaultNpcCombat(role: NpcRole, templateId: string): NpcCombatState {
  if (role === "monster" || templateId.includes("beast") || templateId.includes("rat")) {
    return {
      maxHealth: 8,
      currentHealth: 8,
      armorClass: 11,
      attackBonus: 3,
      damageDice: "1d4+1",
      damageType: "piercing",
      isDefeated: false,
    };
  }

  if (role === "bandit" || templateId.includes("bandit")) {
    return {
      maxHealth: 10,
      currentHealth: 10,
      armorClass: 12,
      attackBonus: 3,
      damageDice: "1d6",
      damageType: "slashing",
      isDefeated: false,
    };
  }

  return {
    maxHealth: 6,
    currentHealth: 6,
    armorClass: 10,
    attackBonus: 1,
    damageDice: "1d4",
    damageType: "bludgeoning",
    isDefeated: false,
  };
}

function normalizeNumber(value: unknown, fallback: number, min = 0) {
  return Number.isFinite(value) ? Math.max(min, Number(value)) : fallback;
}

export function createNpcCombatState(templateId: string, role: NpcRole): NpcCombatState {
  return getDefaultNpcCombat(role, templateId);
}

export function normalizeNpcCombatState(
  templateId: string,
  role: NpcRole,
  combat?: Partial<NpcCombatState>,
): NpcCombatState {
  const fallback = getDefaultNpcCombat(role, templateId);
  const maxHealth = normalizeNumber(combat?.maxHealth, fallback.maxHealth, 1);
  const currentHealth = Math.min(maxHealth, normalizeNumber(combat?.currentHealth, fallback.currentHealth, 0));
  const damageType = combat?.damageType === "piercing" || combat?.damageType === "bludgeoning" || combat?.damageType === "slashing"
    ? combat.damageType
    : fallback.damageType;

  return {
    maxHealth,
    currentHealth,
    armorClass: normalizeNumber(combat?.armorClass, fallback.armorClass, 1),
    attackBonus: normalizeNumber(combat?.attackBonus, fallback.attackBonus),
    damageDice: typeof combat?.damageDice === "string" ? combat.damageDice : fallback.damageDice,
    damageType,
    isDefeated: Boolean(combat?.isDefeated || currentHealth <= 0),
  };
}

function applyEnemyCounterattack(save: GameSave, npcCombat: NpcCombatState): { save: GameSave; enemyAttack: EnemyAttackResult } {
  const player = normalizePlayerProgression(save.player, save.inventory);
  const d20 = rollD20();
  const attackTotal = d20 + npcCombat.attackBonus;
  const hit = d20 === 20 || attackTotal >= player.combat!.armorClass;
  const damage = hit ? Math.max(1, rollDice(npcCombat.damageDice)) : 0;
  const nextHealth = hit ? player.combat!.currentHealth - damage : player.combat!.currentHealth;
  const barelyStanding = nextHealth <= 0;
  const nextPlayer = {
    ...player,
    combat: {
      ...player.combat!,
      currentHealth: barelyStanding ? 1 : Math.max(1, nextHealth),
    },
  };

  return {
    save: {
      ...save,
      player: nextPlayer,
    },
    enemyAttack: {
      d20,
      attackTotal,
      hit,
      damage,
      barelyStanding,
    },
  };
}

export function resolvePlayerAttack(
  save: GameSave,
  npcInstance: NpcInstance,
  action: PlayerAttackAction = { type: "weapon" },
): PlayerAttackResult {
  const normalizedPlayer = normalizePlayerProgression(save.player, save.inventory);
  const workingSave = { ...save, player: normalizedPlayer };
  const validation = validatePlayerCanAttack(workingSave, action);
  const npcCombat = normalizeNpcCombatState(npcInstance.templateId, npcInstance.role, npcInstance.combat);

  if (!validation.ok) {
    return {
      ok: false,
      blockedReason: validation.reason,
      save: workingSave,
      npcInstance: {
        ...npcInstance,
        combat: npcCombat,
      },
    };
  }

  const weapon = validation.weapon;
  const attackAttribute = weapon.attackAttribute ?? "strength";
  const attributeModifier = getAttributeModifier(normalizedPlayer.attributes[attackAttribute]);
  const proficiencyBonus = normalizedPlayer.training?.weapons[validation.weaponType] ? 2 : 0;
  const attackBonus = attributeModifier + proficiencyBonus;
  const d20 = rollD20();
  const critical = d20 === 20;
  const attackTotal = d20 + attackBonus;
  const hit = critical || attackTotal >= npcCombat.armorClass;
  const baseDamage = hit ? Math.max(1, rollDice(weapon.damageDice ?? "1d4") + attributeModifier) : 0;
  const damage = critical ? baseDamage * 2 : baseDamage;
  const nextNpcHealth = hit ? Math.max(0, npcCombat.currentHealth - damage) : npcCombat.currentHealth;
  const enemyDefeated = nextNpcHealth <= 0;
  const nextNpcInstance: NpcInstance = {
    ...npcInstance,
    status: enemyDefeated ? "dead" : npcInstance.status,
    combat: {
      ...npcCombat,
      currentHealth: nextNpcHealth,
      damageType: (weapon.damageType ?? npcCombat.damageType) as DamageType,
      isDefeated: enemyDefeated,
    },
  };

  if (!hit || enemyDefeated) {
    return {
      ok: true,
      save: workingSave,
      npcInstance: nextNpcInstance,
      d20,
      attackTotal,
      hit,
      critical,
      damage,
      enemyDefeated,
    };
  }

  const counterattack = applyEnemyCounterattack(workingSave, npcCombat);

  return {
    ok: true,
    save: counterattack.save,
    npcInstance: nextNpcInstance,
    d20,
    attackTotal,
    hit,
    critical,
    damage,
    enemyDefeated,
    enemyAttack: counterattack.enemyAttack,
  };
}
