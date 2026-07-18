import type { GameSave } from "../save/saveSystem";
import type { PlayerLifeState } from "../../types/player";
import type {
  CombatBlockedReason,
  CombatLogEntry,
  CombatState,
  CombatantState,
  DamageType,
  NpcCombatState,
  PlayerAttackAction,
} from "../../types/combat";
import type { NpcInstance, NpcRole } from "../../types/npc";
import { getAttributeModifier, rollD20, rollDice } from "./diceSystem";
import { validatePlayerCanAttack } from "./combatValidation";
import { normalizePlayerProgression } from "../player/playerProgressionSystem";
import { getNpcLifeState, markNpcDefeatedAfterCombat } from "./postCombatSystem";

export type EnemyAttackResult = {
  actionId: string;
  actorId: string;
  targetId: string;
  d20: number;
  attackTotal: number;
  hit: boolean;
  damage: number;
  playerDefeated: boolean;
};

export type PlayerAttackResult = {
  ok: boolean;
  actionType: PlayerAttackAction["type"];
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

function isDamageType(value: unknown): value is DamageType {
  return (
    value === "slashing" ||
    value === "piercing" ||
    value === "bludgeoning" ||
    value === "fire" ||
    value === "cold" ||
    value === "lightning" ||
    value === "force" ||
    value === "radiant" ||
    value === "necrotic" ||
    value === "poison" ||
    value === "psychic"
  );
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
  const damageType = isDamageType(combat?.damageType)
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
    lifeState: combat?.lifeState ?? (currentHealth <= 0 ? (role === "monster" ? "dead" : "defeated") : "active"),
    defeatedBy: typeof combat?.defeatedBy === "string" ? combat.defeatedBy : undefined,
    defeatedAt: typeof combat?.defeatedAt === "string" ? combat.defeatedAt : undefined,
  };
}

function hasIncapacitatingStatus(combatant: CombatantState) {
  return combatant.statuses.some((status) => status.kind === "stunned" || status.kind === "incapacitated");
}

function normalizeCombatantActivity(combatant: CombatantState): CombatantState {
  const alive = combatant.currentHp > 0;
  const conscious = alive && combatant.conscious;
  const lifeState = alive ? combatant.lifeState : combatant.lifeState === "dead" ? "dead" : "defeated";

  return {
    ...combatant,
    alive,
    conscious,
    canAct: alive && conscious && !hasIncapacitatingStatus(combatant),
    lifeState,
  };
}

function createPlayerCombatant(save: GameSave, initiative?: number): CombatantState {
  const player = normalizePlayerProgression(save.player, save.inventory);
  const playerCombat = player.combat!;
  const maxStamina = player.textCombat?.maxStamina ?? player.derivedStats?.stamina ?? 0;
  const currentStamina = player.textCombat?.stamina ?? maxStamina;
  const maxMana = player.magic?.maxMana ?? 0;
  const currentMana = player.magic?.mana ?? 0;
  const dexterityModifier = getAttributeModifier(player.attributes.dexterity);
  const playerLifeState = player.lifeState ?? (playerCombat.currentHealth <= 0 ? "dead" : "active");
  const isDead = playerLifeState === "dead" || playerCombat.currentHealth <= 0;
  const isDefeated = playerLifeState === "defeated" || playerLifeState === "robbed";

  return normalizeCombatantActivity({
    id: player.id,
    side: "player",
    entityType: "player",
    currentHp: playerCombat.currentHealth,
    maxHp: playerCombat.maxHealth,
    currentMana,
    maxMana,
    currentStamina,
    maxStamina,
    armorClass: playerCombat.armorClass,
    initiative: initiative ?? rollD20() + dexterityModifier,
    dexterityModifier,
    alive: !isDead,
    conscious: !isDead && !isDefeated,
    canAct: !isDead && !isDefeated,
    lifeState: isDead ? "dead" : isDefeated ? "defeated" : "active",
    distance: player.textCombat?.distance,
    cover: player.textCombat?.ranged?.cover,
    statuses: [],
  });
}

function createNpcCombatant(npcInstance: NpcInstance, initiative?: number): CombatantState {
  const npcCombat = normalizeNpcCombatState(npcInstance.templateId, npcInstance.role, npcInstance.combat);
  const dexterityModifier = npcInstance.role === "monster" ? 1 : npcInstance.role === "bandit" ? 2 : 0;
  const lifeState = getNpcLifeState({ ...npcInstance, combat: npcCombat });

  return normalizeCombatantActivity({
    id: npcInstance.instanceId,
    side: "enemy",
    entityType: npcInstance.role === "monster" ? "monster" : "npc",
    templateId: npcInstance.templateId,
    instanceId: npcInstance.instanceId,
    currentHp: npcCombat.currentHealth,
    maxHp: npcCombat.maxHealth,
    currentMana: 0,
    maxMana: 0,
    currentStamina: 0,
    maxStamina: 0,
    armorClass: npcCombat.armorClass,
    initiative: initiative ?? rollD20() + dexterityModifier,
    dexterityModifier,
    alive: npcCombat.currentHealth > 0 && npcInstance.status === "alive",
    conscious: npcCombat.currentHealth > 0 && npcInstance.status === "alive",
    canAct: npcCombat.currentHealth > 0 && npcInstance.status === "alive",
    lifeState,
    distance: npcInstance.textCombat?.distance,
    statuses: [],
  });
}

function sortTurnOrder(combatants: CombatantState[]) {
  return combatants
    .filter((combatant) => combatant.alive)
    .sort((left, right) => {
      if (right.initiative !== left.initiative) {
        return right.initiative - left.initiative;
      }

      if (right.dexterityModifier !== left.dexterityModifier) {
        return right.dexterityModifier - left.dexterityModifier;
      }

      return left.id.localeCompare(right.id);
    })
    .map((combatant) => combatant.id);
}

function getNextLiveTurnIndex(state: CombatState, fromIndex: number) {
  if (state.turnOrder.length === 0) {
    return { index: 0, round: state.round };
  }

  let nextRound = state.round;

  for (let offset = 0; offset < state.turnOrder.length; offset += 1) {
    const rawIndex = fromIndex + offset;
    const wrapped = rawIndex >= state.turnOrder.length;
    const index = rawIndex % state.turnOrder.length;
    const combatant = state.combatants[state.turnOrder[index]];

    if (wrapped && offset === 0) {
      nextRound += 1;
    }

    if (combatant?.alive && combatant.canAct) {
      return { index, round: wrapped ? nextRound + (offset > 0 ? 0 : 0) : nextRound };
    }
  }

  return { index: state.currentTurnIndex, round: nextRound };
}

function getCombatVictoryPhase(state: CombatState): CombatState["phase"] | null {
  const playerAlive = Object.values(state.combatants).some((combatant) => combatant.side === "player" && combatant.alive);
  const enemyAlive = Object.values(state.combatants).some((combatant) => combatant.side === "enemy" && combatant.alive);

  if (!playerAlive) {
    return "defeat";
  }

  if (!enemyAlive) {
    return "victory";
  }

  return null;
}

export function ensureCombatState(save: GameSave, npcInstance: NpcInstance): CombatState {
  const existing = save.activeCombat;
  const existingPlayer = existing?.combatants[save.player.id];
  const existingNpc = existing?.combatants[npcInstance.instanceId];
  const playerCombatant = createPlayerCombatant(save, existingPlayer?.initiative);
  const npcCombatant = createNpcCombatant(npcInstance, existingNpc?.initiative);
  const now = Date.now();

  if (existing && existing.phase !== "finished" && existing.turnOrder.includes(npcInstance.instanceId)) {
    const combatants = {
      ...existing.combatants,
      [playerCombatant.id]: {
        ...existingPlayer,
        ...playerCombatant,
        statuses: existingPlayer?.statuses ?? [],
      },
      [npcCombatant.id]: {
        ...existingNpc,
        ...npcCombatant,
        statuses: existingNpc?.statuses ?? [],
      },
    };
    const turnOrder = existing.turnOrder.filter((id) => combatants[id]?.alive);
    const activeCombatantId = turnOrder[existing.currentTurnIndex] ?? playerCombatant.id;
    const synced: CombatState = {
      ...existing,
      combatants,
      turnOrder: turnOrder.length > 0 ? turnOrder : sortTurnOrder(Object.values(combatants)),
      activeCombatantId,
    };
    const terminalPhase = getCombatVictoryPhase(synced);

    return terminalPhase
      ? { ...synced, phase: terminalPhase, finishedAt: terminalPhase === "victory" || terminalPhase === "defeat" ? now : synced.finishedAt }
      : synced;
  }

  const combatants = {
    [playerCombatant.id]: playerCombatant,
    [npcCombatant.id]: npcCombatant,
  };
  const turnOrder = sortTurnOrder(Object.values(combatants));
  const playerIndex = Math.max(0, turnOrder.indexOf(playerCombatant.id));

  return {
    combatId: `combat_${now}_${npcInstance.instanceId}`,
    phase: "awaitingPlayerAction",
    round: 1,
    turnOrder,
    currentTurnIndex: playerIndex,
    activeCombatantId: turnOrder[playerIndex] ?? playerCombatant.id,
    combatants,
    appliedActionIds: [],
    log: [],
    startedAt: now,
  };
}

export function syncCombatStateAfterPlayerAction(
  state: CombatState,
  save: GameSave,
  npcInstance: NpcInstance,
  options: {
    actionId: string;
    actionType: CombatLogEntry["actionType"];
    outcome: CombatLogEntry["outcome"];
    targetDefeated?: boolean;
    debug?: Record<string, unknown>;
  },
): CombatState {
  if (state.appliedActionIds.includes(options.actionId)) {
    return state;
  }

  const playerCombatant = createPlayerCombatant(save, state.combatants[save.player.id]?.initiative);
  const npcCombatant = createNpcCombatant(npcInstance, state.combatants[npcInstance.instanceId]?.initiative);
  const combatants = {
    ...state.combatants,
    [playerCombatant.id]: {
      ...state.combatants[playerCombatant.id],
      ...playerCombatant,
      statuses: state.combatants[playerCombatant.id]?.statuses ?? [],
    },
    [npcCombatant.id]: {
      ...state.combatants[npcCombatant.id],
      ...npcCombatant,
      statuses: state.combatants[npcCombatant.id]?.statuses ?? [],
    },
  };
  const turnOrder = state.turnOrder.filter((id) => combatants[id]?.alive);
  const currentIndex = Math.max(0, turnOrder.indexOf(playerCombatant.id));
  const nextTurn = getNextLiveTurnIndex({ ...state, combatants, turnOrder, currentTurnIndex: currentIndex }, currentIndex + 1);
  const nextState: CombatState = {
    ...state,
    phase: "resolvingEnemyTurns",
    combatants,
    turnOrder,
    currentTurnIndex: nextTurn.index,
    round: nextTurn.round,
    activeCombatantId: turnOrder[nextTurn.index] ?? playerCombatant.id,
    appliedActionIds: [...state.appliedActionIds, options.actionId].slice(-100),
    log: [
      ...state.log,
      {
        id: options.actionId,
        round: state.round,
        actorId: playerCombatant.id,
        targetId: npcCombatant.id,
        actionType: options.actionType,
        outcome: options.outcome,
        createdAt: Date.now(),
        debug: options.debug,
      },
    ].slice(-100),
  };
  const terminalPhase = getCombatVictoryPhase(nextState);

  return terminalPhase
    ? { ...nextState, phase: terminalPhase, finishedAt: Date.now(), activeCombatantId: playerCombatant.id }
    : nextState;
}

export function finishCombatCycleForPlayer(state: CombatState, playerId: string): CombatState {
  const terminalPhase = getCombatVictoryPhase(state);

  if (terminalPhase) {
    return { ...state, phase: terminalPhase, finishedAt: Date.now(), activeCombatantId: playerId };
  }

  const playerIndex = Math.max(0, state.turnOrder.indexOf(playerId));

  return {
    ...state,
    phase: "awaitingPlayerAction",
    currentTurnIndex: playerIndex,
    activeCombatantId: playerId,
  };
}

export function resolveEnemyTurn(save: GameSave, npcInstance: NpcInstance, state: CombatState): { save: GameSave; combatState: CombatState; enemyAttack?: EnemyAttackResult } {
  const player = normalizePlayerProgression(save.player, save.inventory);
  const npcCombat = normalizeNpcCombatState(npcInstance.templateId, npcInstance.role, npcInstance.combat);
  const enemyCombatant = state.combatants[npcInstance.instanceId];

  if (!enemyCombatant?.alive || !enemyCombatant.canAct || npcCombat.currentHealth <= 0 || player.combat!.currentHealth <= 0) {
    return { save: { ...save, player }, combatState: finishCombatCycleForPlayer(state, player.id) };
  }

  const d20 = rollD20();
  const attackTotal = d20 + npcCombat.attackBonus;
  const hit = d20 === 20 || attackTotal >= player.combat!.armorClass;
  const damage = hit ? Math.max(1, rollDice(npcCombat.damageDice)) : 0;
  const rawNextHealth = hit ? Math.max(0, player.combat!.currentHealth - damage) : player.combat!.currentHealth;
  const playerDefeated = rawNextHealth <= 0;
  const nextHealth = playerDefeated ? 1 : rawNextHealth;
  const actionId = `enemy_${Date.now()}_${npcInstance.instanceId}`;
  const enemyOutcome: CombatLogEntry["outcome"] = hit
    ? d20 === 20
      ? "criticalSuccess"
      : "success"
    : d20 === 1
      ? "criticalFailure"
      : "miss";
  const nextPlayer = {
    ...player,
    lifeState: (playerDefeated ? "defeated" : "active") as PlayerLifeState,
    combat: {
      ...player.combat!,
      currentHealth: nextHealth,
    },
  };
  const nextSave = {
    ...save,
    player: nextPlayer,
  };
  const playerCombatant = createPlayerCombatant(nextSave, state.combatants[player.id]?.initiative);
  const combatants = {
    ...state.combatants,
    [playerCombatant.id]: {
      ...state.combatants[playerCombatant.id],
      ...playerCombatant,
      statuses: state.combatants[playerCombatant.id]?.statuses ?? [],
    },
  };
  const turnOrder = state.turnOrder.filter((id) => combatants[id]?.alive);
  const nextStateBase: CombatState = {
    ...state,
    combatants,
    turnOrder,
    appliedActionIds: [...state.appliedActionIds, actionId].slice(-100),
    log: [
      ...state.log,
      {
        id: actionId,
        round: state.round,
        actorId: npcInstance.instanceId,
        targetId: player.id,
        actionType: "meleeAttack" as const,
        outcome: enemyOutcome,
        createdAt: Date.now(),
        debug: {
          d20,
          attackTotal,
          damage,
          playerArmorClass: player.combat!.armorClass,
        },
      },
    ].slice(-100),
  };
  const combatState = playerDefeated
    ? { ...nextStateBase, phase: "defeat" as const, finishedAt: Date.now(), activeCombatantId: player.id }
    : finishCombatCycleForPlayer(nextStateBase, player.id);

  return {
    save: nextSave,
    combatState,
    enemyAttack: {
      actionId,
      actorId: npcInstance.instanceId,
      targetId: player.id,
      d20,
      attackTotal,
      hit,
      damage,
      playerDefeated,
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
      actionType: action.type,
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
  const proficiencyBonus = validation.weaponType !== "unarmed" && normalizedPlayer.training?.weapons[validation.weaponType] ? 2 : 0;
  const attackBonus = attributeModifier + proficiencyBonus;
  const d20 = rollD20();
  const critical = d20 === 20;
  const actionDifficultyPenalty = action.type === "kick" ? 1 : action.type === "shove" || action.type === "grapple" ? 0 : 0;
  const attackTotal = d20 + attackBonus - actionDifficultyPenalty;
  const hit = critical || attackTotal >= npcCombat.armorClass;
  const causesDamage = action.type !== "shove" && action.type !== "grapple";
  const baseDamage = hit && causesDamage ? Math.max(1, rollDice(weapon.damageDice ?? "1d2") + attributeModifier) : 0;
  const damage = critical ? baseDamage * 2 : baseDamage;
  const nextNpcHealth = hit ? Math.max(0, npcCombat.currentHealth - damage) : npcCombat.currentHealth;
  const enemyDefeated = nextNpcHealth <= 0;
  const damagedNpcInstance: NpcInstance = {
    ...npcInstance,
    combat: {
      ...npcCombat,
      currentHealth: nextNpcHealth,
      damageType: (weapon.damageType ?? npcCombat.damageType) as DamageType,
      isDefeated: enemyDefeated,
      lifeState: enemyDefeated ? (npcInstance.role === "monster" ? "dead" : "defeated") : npcCombat.lifeState,
    },
  };
  const nextNpcInstance = enemyDefeated ? markNpcDefeatedAfterCombat(damagedNpcInstance, save.player.id) : damagedNpcInstance;

  return {
    ok: true,
    actionType: action.type,
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
