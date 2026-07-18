import type { CombatPhase } from "../../types/combat";

type CombatInputPolicyParams = {
  hasCombatScene: boolean;
  canUseNpcDialogue: boolean;
  targetActive: boolean;
  playerCanAct: boolean;
  combatPhase?: CombatPhase;
  activeCombatantId?: string;
  playerId?: string;
};

export function getCombatInputPolicy(params: CombatInputPolicyParams) {
  const hasStartedCombat = Boolean(params.combatPhase);
  const isPlayerTurn = !hasStartedCombat || (
    params.combatPhase === "awaitingPlayerAction" &&
    (!params.activeCombatantId || params.activeCombatantId === params.playerId)
  );
  const canUseCombatInput = params.hasCombatScene && params.targetActive && params.playerCanAct;
  const canUseInput = params.canUseNpcDialogue || canUseCombatInput;

  return {
    canUseCombatInput,
    readOnly: !canUseInput,
    disabled: canUseInput && canUseCombatInput && !isPlayerTurn,
    waitingForEnemy: canUseCombatInput && !isPlayerTurn,
  };
}
