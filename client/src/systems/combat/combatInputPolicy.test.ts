import { getCombatInputPolicy } from "./combatInputPolicy";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const initialMonster = getCombatInputPolicy({ hasCombatScene: true, canUseNpcDialogue: false, targetActive: true, playerCanAct: true });
assert(!initialMonster.readOnly && !initialMonster.disabled, "A living monster scene must accept the player's first combat action.");
const enemyTurn = getCombatInputPolicy({
  hasCombatScene: true, canUseNpcDialogue: false, targetActive: true, playerCanAct: true,
  combatPhase: "resolvingEnemyTurns", activeCombatantId: "monster", playerId: "player",
});
assert(enemyTurn.disabled && enemyTurn.waitingForEnemy, "Input must be disabled during the enemy turn.");
const returnedTurn = getCombatInputPolicy({
  hasCombatScene: true, canUseNpcDialogue: false, targetActive: true, playerCanAct: true,
  combatPhase: "awaitingPlayerAction", activeCombatantId: "player", playerId: "player",
});
assert(!returnedTurn.disabled, "Input must return after the enemy turn.");
