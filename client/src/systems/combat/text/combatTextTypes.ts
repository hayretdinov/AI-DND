import type { DamageType, WeaponType } from "../../../types/combat";
import type { InventoryItem } from "../../../types/inventory";
import type { GameSave } from "../../save/saveSystem";
import type { NpcInstance } from "../../../types/npc";
import type { PlayerRangedCombatState } from "../ranged/rangedCombatTypes";

export type CombatIntent =
  | "attack"
  | "defend"
  | "block"
  | "parry"
  | "dodge"
  | "counterattack"
  | "feint"
  | "disarm"
  | "trip"
  | "shove"
  | "grapple"
  | "breakGrapple"
  | "closeDistance"
  | "increaseDistance"
  | "holdDistance"
  | "intercept"
  | "guard"
  | "readyAction"
  | "weaponStrike"
  | "shieldBash"
  | "pommelStrike"
  | "breakGuard"
  | "escape"
  | "pickUpWeapon"
  | "switchWeapon"
  | "throwWeapon"
  | "unknown";

export type MeleeWeaponCategory =
  | "unarmed"
  | "sword"
  | "dagger"
  | "knife"
  | "club"
  | "mace"
  | "axe"
  | "spear"
  | "staff"
  | "hammer"
  | "shield"
  | "improvised";
export type WeaponCategory = WeaponType | MeleeWeaponCategory | "throwing";
export type AttackType = "slash" | "thrust" | "chop" | "bash" | "pommel" | "kick" | "punch" | "hook" | "unknown";
export type DefenseType = "block" | "parry" | "dodge" | "guard" | "none";
export type BodyZone =
  | "head"
  | "neck"
  | "torso"
  | "chest"
  | "abdomen"
  | "leftArm"
  | "rightArm"
  | "leftHand"
  | "rightHand"
  | "leftLeg"
  | "rightLeg"
  | "weapon"
  | "shield";
export type AttackDirection = "overhead" | "left" | "right" | "low" | "straight" | "rising" | "unknown";
export type AttackPower = "light" | "normal" | "heavy" | "allOut";
export type AttackTempo = "quick" | "normal" | "slow";
export type WeaponGrip = "oneHanded" | "twoHanded" | "reverse" | "halfSword" | "unknown";
export type CombatMovement = "none" | "stepForward" | "stepBack" | "left" | "right" | "circle" | "lunge" | "rush";
export type CombatDistance = "grapple" | "veryClose" | "melee" | "reach" | "medium";
export type CombatStance = "balanced" | "aggressive" | "defensive" | "guardHigh" | "guardLow" | "mobile";
export type CombatTechniqueId =
  | "basicSlash"
  | "aimedThrust"
  | "powerChop"
  | "shieldBash"
  | "quickParry"
  | "riposte"
  | "disarmBind"
  | "legSweep";
export type CombatParseWarning =
  | "lowConfidence"
  | "overloadedAction"
  | "claimedOutcome"
  | "unknownWeapon"
  | "unknownTargetZone"
  | "nonCombatText";
export type CombatValidationReason =
  | "notCombat"
  | "npcUnavailable"
  | "npcDefeated"
  | "noWeapon"
  | "weaponNotEquipped"
  | "notTrained"
  | "noObjectToThrow"
  | "invalidAction"
  | "wrongDistance"
  | "notEnoughStamina"
  | "overloaded"
  | "unknownAction";
export type CombatInjuryType =
  | "bleeding"
  | "fracture"
  | "concussion"
  | "armorDamage"
  | "shieldDamage"
  | "disarm"
  | "knockdown"
  | "stagger"
  | "limbInjury"
  | "deepWound"
  | "puncture"
  | "guardBroken"
  | "grappled";

export type CombatInjury = {
  id: string;
  type: CombatInjuryType;
  zone?: BodyZone;
  severity: "minor" | "moderate" | "severe";
  remainingTurns?: number;
  persistent: boolean;
  source?: string;
};

export type PlayerTextCombatState = {
  maxStamina: number;
  stamina: number;
  stance: CombatStance;
  distance: CombatDistance;
  balance: number;
  knownTechniques: CombatTechniqueId[];
  injuries: CombatInjury[];
  detailedRolls: boolean;
  ranged?: PlayerRangedCombatState;
};

export type NpcTextCombatState = {
  stance: CombatStance;
  distance: CombatDistance;
  balance: number;
  injuries: CombatInjury[];
  telegraphedAction?: ParsedCombatAction;
};

export type ParsedCombatAction = {
  rawText: string;
  normalizedText: string;
  actorId: string;
  targetId?: string;
  intent: CombatIntent;
  weaponId?: string;
  weaponCategory?: WeaponCategory;
  attackType?: AttackType;
  defenseType?: DefenseType;
  techniqueId?: CombatTechniqueId;
  targetZone?: BodyZone;
  direction?: AttackDirection;
  power: AttackPower;
  tempo: AttackTempo;
  grip?: WeaponGrip;
  movement: CombatMovement;
  requestedDistance?: CombatDistance;
  conditionalAction?: string;
  secondaryMovement?: CombatMovement;
  unknownTokens: string[];
  matchedPhrases: string[];
  confidence: number;
  isOverloaded: boolean;
  warnings: CombatParseWarning[];
};

export type TextCombatValidationResult =
  | { ok: true; weapon?: InventoryItem; weaponType?: WeaponType; weaponCategory?: WeaponCategory; staminaCost: number; distancePenalty: number }
  | { ok: false; reason: CombatValidationReason; staminaCost: number; distancePenalty: number; message: string };

export type TextCombatResolutionResult = {
  ok: boolean;
  parsedAction: ParsedCombatAction;
  validation: TextCombatValidationResult;
  save: GameSave;
  npcInstance: NpcInstance;
  d20?: number;
  attackTotal?: number;
  difficultyClass?: number;
  hit?: boolean;
  critical?: boolean;
  fumble?: boolean;
  damage?: number;
  damageType?: DamageType;
  staminaSpent: number;
  distance: CombatDistance;
  playerStance: CombatStance;
  npcStance: CombatStance;
  injuriesApplied: CombatInjury[];
  enemyDefeated?: boolean;
  enemyReaction?: "counterattack" | "guard" | "stagger" | "flee" | "none";
  enemyTelegraph?: ParsedCombatAction;
  narrationHints: string[];
};
