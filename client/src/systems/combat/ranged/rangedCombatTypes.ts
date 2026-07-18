import type { DamageType, WeaponType } from "../../../types/combat";
import type { InventoryItem } from "../../../types/inventory";
import type { GameSave } from "../../save/saveSystem";
import type { NpcInstance } from "../../../types/npc";
import type { BodyZone, CombatDistance, CombatInjury, CombatMovement } from "../text";

export type RangedCombatIntent =
  | "aim"
  | "shoot"
  | "quickShot"
  | "snapShot"
  | "preciseShot"
  | "powerShot"
  | "leadingShot"
  | "readyShot"
  | "reload"
  | "cockWeapon"
  | "loadAmmo"
  | "changeAmmo"
  | "takeCover"
  | "leaveCover"
  | "closeDistance"
  | "increaseDistance"
  | "switchWeapon"
  | "unknown";

export type RangedWeaponCategory =
  | "handCrossbow"
  | "lightCrossbow"
  | "huntingCrossbow"
  | "heavyCrossbow"
  | "shortBow"
  | "longBow"
  | "throwingWeapon";

export type AmmoCategory = "commonBolt" | "armorPiercingBolt" | "broadheadBolt" | "fireBolt" | "poisonBolt" | "arrow" | "armorPiercingArrow" | "thrown";
export type RangedShotType = "normal" | "quick" | "snap" | "precise" | "power" | "leading" | "prepared";
export type RangedStance = "standing" | "kneeling" | "prone" | "fromCover" | "moving";
export type CoverLevel = "none" | "partial" | "half" | "full";
export type ReloadStage = "ready" | "uncocked" | "cocking" | "cocked" | "loadingAmmo" | "loaded" | "jammed";
export type AimState = { level: number; targetId?: string; targetZone?: BodyZone };

export type RangedWeaponState = {
  weaponId: string;
  loaded: boolean;
  cocked: boolean;
  loadedAmmoItemId?: string;
  loadedAmmoCategory?: AmmoCategory;
  reloadStage: ReloadStage;
  reloadProgress: number;
  durability: number;
  jammed: boolean;
  aimState?: AimState;
};

export type PlayerRangedCombatState = {
  weapons: Record<string, RangedWeaponState>;
  cover: CoverLevel;
  lastTargetId?: string;
};

export type RangedParseWarning =
  | "lowConfidence"
  | "overloadedAction"
  | "claimedOutcome"
  | "unknownWeapon"
  | "unknownTargetZone"
  | "nonCombatText";

export type RangedValidationReason =
  | "notRangedCombat"
  | "npcDefeated"
  | "noRangedWeapon"
  | "weaponNotEquipped"
  | "notLoaded"
  | "noAmmo"
  | "wrongAmmo"
  | "wrongDistance"
  | "lineBlocked"
  | "fullCover"
  | "notEnoughStamina"
  | "overloaded"
  | "unknownAction";

export type ParsedRangedAction = {
  rawText: string;
  normalizedText: string;
  actorId: string;
  targetId?: string;
  intent: RangedCombatIntent;
  weaponId?: string;
  weaponCategory?: RangedWeaponCategory;
  ammoItemId?: string;
  ammoCategory?: AmmoCategory;
  shotType?: RangedShotType;
  targetZone?: BodyZone;
  stance?: RangedStance;
  aimingRequested: boolean;
  movement: CombatMovement;
  coverRequested?: CoverLevel;
  readyCondition?: string;
  unknownTokens: string[];
  matchedPhrases: string[];
  confidence: number;
  isOverloaded: boolean;
  warnings: RangedParseWarning[];
};

export type RangedValidationResult =
  | {
      ok: true;
      weapon: InventoryItem;
      ammo?: InventoryItem;
      weaponType: WeaponType;
      weaponCategory: RangedWeaponCategory;
      staminaCost: number;
      distancePenalty: number;
      coverPenalty: number;
    }
  | {
      ok: false;
      reason: RangedValidationReason;
      staminaCost: number;
      distancePenalty: number;
      coverPenalty: number;
      message: string;
    };

export type RangedCombatResolutionResult = {
  ok: boolean;
  parsedAction: ParsedRangedAction;
  validation: RangedValidationResult;
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
  ammunitionSpent: number;
  distance: CombatDistance;
  injuriesApplied: CombatInjury[];
  enemyDefeated?: boolean;
  narrationHints: string[];
};
