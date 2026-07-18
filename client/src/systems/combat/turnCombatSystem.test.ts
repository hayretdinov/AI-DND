import type { GameSave } from "../save/saveSystem";
import type { NpcInstance } from "../../types/npc";
import {
  ensureCombatState,
  resolveEnemyTurn,
  syncCombatStateAfterPlayerAction,
} from "./combatSystem";

function createSave(): GameSave {
  return {
    player: {
      id: "test-player",
      name: "Test",
      origin: "hunter",
      race: "human",
      gender: "male",
      characterClass: "warrior",
      appearance: "wanderer",
      currentOutfitStage: "rags",
      portraitUrl: "",
      attributes: {
        strength: 12,
        dexterity: 12,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      derivedStats: {
        health: 12,
        stamina: 10,
        armorClass: 11,
      },
      combat: {
        maxHealth: 12,
        currentHealth: 12,
        armorClass: 11,
        initiative: 0,
        attackBonus: 1,
        defenseBonus: 0,
      },
      createdAt: new Date(0).toISOString(),
    },
  };
}

function createNpc(): NpcInstance {
  return {
    npcId: "bandit-test",
    instanceId: "bandit-test",
    templateId: "bandit-test",
    role: "bandit",
    status: "alive",
    createdAt: new Date(0).toISOString(),
    relationship: -50,
    trust: 0,
    fear: 0,
    hostility: 80,
    met: true,
    dialogueHistory: [],
    combat: {
      maxHealth: 10,
      currentHealth: 10,
      armorClass: 12,
      attackBonus: 3,
      damageDice: "1d6",
      damageType: "slashing",
      isDefeated: false,
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runTurnCombatSelfTest() {
  const save = createSave();
  const npc = createNpc();
  const state = ensureCombatState(save, npc);

  assert(state.turnOrder.includes(save.player.id), "Combat state must include the player.");
  assert(state.turnOrder.includes(npc.instanceId), "Combat state must include the enemy.");
  assert(state.combatants[save.player.id].currentHp === save.player.combat!.currentHealth, "Player HP must be copied into CombatState.");
  assert(state.combatants[npc.instanceId].currentHp === npc.combat!.currentHealth, "Enemy HP must be copied into CombatState.");

  const afterPlayer = syncCombatStateAfterPlayerAction(state, save, npc, {
    actionId: "test-action-1",
    actionType: "meleeAttack",
    outcome: "miss",
  });
  const duplicate = syncCombatStateAfterPlayerAction(afterPlayer, save, npc, {
    actionId: "test-action-1",
    actionType: "meleeAttack",
    outcome: "miss",
  });

  assert(duplicate.log.length === afterPlayer.log.length, "The same action must not be applied twice.");

  const beforePlayerHp = save.player.combat!.currentHealth;
  const enemyTurn = resolveEnemyTurn(save, npc, afterPlayer);
  const afterPlayerHp = enemyTurn.save.player.combat!.currentHealth;

  assert(afterPlayerHp <= beforePlayerHp, "Enemy turn must not heal the player.");
  assert(enemyTurn.combatState.phase === "awaitingPlayerAction" || enemyTurn.combatState.phase === "defeat", "Enemy turn must return control or end combat.");
}
