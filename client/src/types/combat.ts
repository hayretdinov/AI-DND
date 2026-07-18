export type WeaponType =
  | "oneHandedSword"
  | "twoHandedSword"
  | "dagger"
  | "axe"
  | "mace"
  | "club"
  | "spear"
  | "bow"
  | "shortBow"
  | "longBow"
  | "handCrossbow"
  | "lightCrossbow"
  | "huntingCrossbow"
  | "heavyCrossbow"
  | "staff"
  | "unarmed";

export type DamageType =
  | "slashing"
  | "piercing"
  | "bludgeoning"
  | "fire"
  | "cold"
  | "lightning"
  | "force"
  | "radiant"
  | "necrotic"
  | "poison"
  | "psychic";
export type AttackAttribute = "strength" | "dexterity";

export type CombatStats = {
  maxHealth: number;
  currentHealth: number;
  armorClass: number;
  initiative: number;
  attackBonus: number;
  defenseBonus: number;
};

export type WeaponTraining = Record<WeaponType, boolean>;

export type CombatTraining = {
  basicAttack: boolean;
  powerAttack: boolean;
  aimedAttack: boolean;
  parry: boolean;
  dodge: boolean;
};

export type PlayerTraining = {
  weapons: WeaponTraining;
  combat: CombatTraining;
};

export type NpcCombatState = {
  maxHealth: number;
  currentHealth: number;
  armorClass: number;
  attackBonus: number;
  damageDice: string;
  damageType: DamageType;
  isDefeated: boolean;
  lifeState?: CombatantLifeState;
  defeatedBy?: string;
  defeatedAt?: string;
};

export type CombatantLifeState =
  | "active"
  | "wounded"
  | "incapacitated"
  | "unconscious"
  | "surrendered"
  | "defeated"
  | "dead";

export type PostCombatPhase =
  | "none"
  | "playerDefeated"
  | "npcDefeatedAlive"
  | "enemyDead"
  | "monsterDefeated"
  | "loot"
  | "dialogue"
  | "exit";

export type CombatPhase =
  | "starting"
  | "awaitingPlayerAction"
  | "resolvingPlayerAction"
  | "resolvingEnemyTurns"
  | "roundEnd"
  | "victory"
  | "defeat"
  | "finished";

export type CombatantSide = "player" | "ally" | "enemy";
export type CombatantEntityType = "player" | "npc" | "monster";

export type CombatStatusEffect = {
  id: string;
  kind: "defending" | "blocking" | "parrying" | "dodging" | "stunned" | "incapacitated" | "bleeding" | "custom";
  remainingRounds?: number;
};

export type CombatantState = {
  id: string;
  side: CombatantSide;
  entityType: CombatantEntityType;
  templateId?: string;
  instanceId?: string;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  currentStamina: number;
  maxStamina: number;
  armorClass: number;
  initiative: number;
  dexterityModifier: number;
  alive: boolean;
  conscious: boolean;
  canAct: boolean;
  lifeState: CombatantLifeState;
  position?: string;
  distance?: string;
  cover?: string;
  statuses: CombatStatusEffect[];
};

export type CombatActionType =
  | "meleeAttack"
  | "rangedAttack"
  | "magic"
  | "defend"
  | "move"
  | "reload"
  | "useItem"
  | "flee"
  | "wait";

export type CombatActionOutcome =
  | "success"
  | "miss"
  | "dodge"
  | "block"
  | "parry"
  | "criticalSuccess"
  | "criticalFailure"
  | "invalid";

export type CombatActionResult = {
  actionId: string;
  actorId: string;
  targetId?: string;
  actionType: CombatActionType;
  outcome: CombatActionOutcome;
  hpBefore?: number;
  hpAfter?: number;
  damageApplied?: number;
  manaSpent?: number;
  staminaSpent?: number;
  ammoSpent?: number;
  statusesApplied?: string[];
  actorDefeated?: boolean;
  targetDefeated?: boolean;
  narrationContext: Record<string, unknown>;
  debug?: Record<string, unknown>;
};

export type CombatLogEntry = {
  id: string;
  round: number;
  actorId: string;
  targetId?: string;
  actionType: CombatActionType;
  outcome: CombatActionOutcome;
  createdAt: number;
  debug?: Record<string, unknown>;
};

export type CombatState = {
  combatId: string;
  phase: CombatPhase;
  round: number;
  turnOrder: string[];
  currentTurnIndex: number;
  activeCombatantId: string;
  combatants: Record<string, CombatantState>;
  appliedActionIds: string[];
  log: CombatLogEntry[];
  startedAt: number;
  finishedAt?: number;
  postCombatPhase?: PostCombatPhase;
  defeatedCombatantIds?: string[];
};

export type PlayerAttackAction = {
  type: "auto" | "weapon" | "unarmed" | "kick" | "shove" | "grapple" | "throw_object" | "improvised";
  objectHint?: "stone" | "bottle" | "torch" | "stick" | "item";
  objectName?: string;
  objectAvailable?: boolean;
};

export type CombatBlockedReason = "noWeapon" | "weaponNotEquipped" | "notTrained" | "noObjectToThrow" | "invalidAction";
