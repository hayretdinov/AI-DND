import type {
  AttackPower,
  AttackTempo,
  AttackType,
  CombatMovement,
  CombatStance,
  CombatTechniqueId,
  PlayerTextCombatState,
  WeaponCategory,
} from "./combatTextTypes";
import { createDefaultPlayerRangedCombatState } from "../ranged/rangedWeaponState";
import { getMeleeWeaponDefinition } from "./meleeWeaponConfig";

export function createDefaultPlayerTextCombatState(maxStamina = 10): PlayerTextCombatState {
  const safeMax = Math.max(1, Math.floor(maxStamina));

  return {
    maxStamina: safeMax,
    stamina: safeMax,
    stance: "balanced",
    distance: "melee",
    balance: 0,
    knownTechniques: ["basicSlash"],
    injuries: [],
    detailedRolls: false,
    ranged: createDefaultPlayerRangedCombatState(),
  };
}

export function getCombatStaminaCost(options: {
  power: AttackPower;
  tempo: AttackTempo;
  movement: CombatMovement;
  techniqueId?: CombatTechniqueId;
  weaponCategory?: WeaponCategory;
  attackType?: AttackType;
}) {
  const weaponBaseCost = getMeleeWeaponDefinition(options.weaponCategory)?.staminaCost;
  const defaultPowerCost = options.power === "light" ? 1 : options.power === "heavy" ? 3 : options.power === "allOut" ? 5 : 2;
  const powerCost = weaponBaseCost ?? defaultPowerCost;
  const powerAdjustment = options.power === "light" ? -1 : options.power === "heavy" ? 1 : options.power === "allOut" ? 3 : 0;
  const tempoCost = options.tempo === "quick" ? 1 : 0;
  const movementCost = options.movement === "none" ? 0 : options.movement === "lunge" || options.movement === "rush" ? 2 : 1;
  const techniqueCost = options.techniqueId ? 1 : 0;
  const attackTypeCost = options.attackType === "kick" ? 1 : 0;

  return Math.max(1, powerCost + powerAdjustment + tempoCost + movementCost + techniqueCost + attackTypeCost);
}

export function spendCombatStamina(state: PlayerTextCombatState, cost: number): PlayerTextCombatState {
  return {
    ...state,
    stamina: Math.max(0, state.stamina - cost),
  };
}

export function setCombatStance(state: PlayerTextCombatState, stance: CombatStance): PlayerTextCombatState {
  return {
    ...state,
    stance,
  };
}
