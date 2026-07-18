import type { CombatantState, WeaponType } from "../../types/combat";
import type { InventoryItem } from "../../types/inventory";

export type CombatThoughtHintCategory =
  | "attack"
  | "defense"
  | "movement"
  | "magic"
  | "ranged"
  | "resource"
  | "postCombat"
  | "system";

export type WeaponDefinition = Pick<InventoryItem, "id" | "templateId" | "weaponType" | "category">;
export type ItemDefinition = Pick<InventoryItem, "id" | "templateId" | "category" | "equipmentSlot" | "slot">;

export interface CombatHintContext {
  phase: string;
  player: CombatantState;
  target?: CombatantState;
  equippedWeapon?: WeaponDefinition;
  offhandItem?: ItemDefinition;
  knownMagicWordIds: string[];
  availableFormulaIds: string[];
  distance?: string;
  cover?: string;
  previousInputStatus?: "accepted" | "unrecognized" | "invalid";
  postCombatState?: string;
  activeCombatantId?: string;
  rangedWeaponLoaded?: boolean;
  hasAmmo?: boolean;
}

export interface CombatThoughtHint {
  id: string;
  textKey: string;
  exampleKey?: string;
  exampleCommand?: string;
  priority: number;
  category: CombatThoughtHintCategory;
}

const MAX_HINTS = 6;
const PLAYER_TURN_PHASES = new Set(["awaitingPlayerAction", "starting", "roundEnd"]);
const POST_COMBAT_STATES = new Set(["playerDefeated", "npcDefeatedAlive", "enemyDead", "monsterDefeated", "loot", "dialogue", "defeated", "unconscious", "surrendered", "dead"]);
const RANGED_WEAPON_TYPES = new Set<WeaponType>(["bow", "shortBow", "longBow", "handCrossbow", "lightCrossbow", "huntingCrossbow", "heavyCrossbow"]);
const CROSSBOW_WEAPON_TYPES = new Set<WeaponType>(["handCrossbow", "lightCrossbow", "huntingCrossbow", "heavyCrossbow"]);
const SHIELD_SLOTS = new Set(["shield", "offHand"]);

function addHint(hints: CombatThoughtHint[], hint: CombatThoughtHint) {
  if (!hints.some((candidate) => candidate.id === hint.id)) {
    hints.push(hint);
  }
}

function canPlayerAct(context: CombatHintContext) {
  if (!context.player.alive || !context.player.conscious || !context.player.canAct) {
    return false;
  }

  if (context.activeCombatantId && context.activeCombatantId !== context.player.id) {
    return false;
  }

  return PLAYER_TURN_PHASES.has(context.phase) || !context.phase;
}

function isLow(current: number, max: number) {
  return max > 0 && current > 0 && current / max <= 0.3;
}

function hasShield(context: CombatHintContext) {
  const item = context.offhandItem;

  return Boolean(item && (item.category === "shield" || SHIELD_SLOTS.has(item.equipmentSlot ?? "") || SHIELD_SLOTS.has(item.slot ?? "")));
}

function getWeaponType(context: CombatHintContext): WeaponType {
  return context.equippedWeapon?.weaponType ?? "unarmed";
}

function isTooFarForMelee(distance?: string) {
  return distance === "medium";
}

function isTooCloseForReachWeapon(distance?: string) {
  return distance === "grapple" || distance === "veryClose";
}

function canCastCombatFormula(context: CombatHintContext) {
  const knownWords = new Set(context.knownMagicWordIds);
  const knownFormulas = new Set(context.availableFormulaIds);
  const knowsFireLance =
    knownFormulas.has("fire_lance") ||
    (knownWords.has("ignis") && knownWords.has("lancea") && knownWords.has("hostis"));

  return context.player.currentMana >= 11 && Boolean(context.target) && knowsFireLance;
}

function addWeaponAttackHint(hints: CombatThoughtHint[], weaponType: WeaponType, context: CombatHintContext) {
  if (RANGED_WEAPON_TYPES.has(weaponType)) {
    if (context.hasAmmo === false) {
      addHint(hints, {
        id: "ranged-no-ammo",
        textKey: "thought.combatHint.rangedNoAmmo",
        priority: 86,
        category: "resource",
      });
      return;
    }

    if (CROSSBOW_WEAPON_TYPES.has(weaponType) && context.rangedWeaponLoaded === false) {
      addHint(hints, {
        id: "ranged-reload-crossbow",
        textKey: "thought.combatHint.reloadCrossbow",
        exampleKey: "thought.combatHint.example.reloadCrossbow",
        priority: 96,
        category: "ranged",
      });
      return;
    }

    addHint(hints, {
      id: "ranged-shoot",
      textKey: "thought.combatHint.rangedShoot",
      exampleKey: CROSSBOW_WEAPON_TYPES.has(weaponType)
        ? "thought.combatHint.example.crossbowShot"
        : "thought.combatHint.example.bowShot",
      priority: 92,
      category: "ranged",
    });
    return;
  }

  if (isTooFarForMelee(context.distance)) {
    addHint(hints, {
      id: "close-distance",
      textKey: "thought.combatHint.closeDistance",
      exampleKey: "thought.combatHint.example.closeDistance",
      priority: 95,
      category: "movement",
    });
    return;
  }

  if (weaponType === "spear") {
    if (isTooCloseForReachWeapon(context.distance)) {
      addHint(hints, {
        id: "spear-create-distance",
        textKey: "thought.combatHint.spearTooClose",
        exampleKey: "thought.combatHint.example.stepBackSpear",
        priority: 94,
        category: "movement",
      });
      return;
    }

    addHint(hints, {
      id: "spear-thrust",
      textKey: "thought.combatHint.spearAttack",
      exampleKey: "thought.combatHint.example.spearAttack",
      priority: 91,
      category: "attack",
    });
    return;
  }

  if (weaponType === "dagger") {
    addHint(hints, {
      id: "dagger-stab",
      textKey: "thought.combatHint.daggerAttack",
      exampleKey: "thought.combatHint.example.daggerAttack",
      priority: 90,
      category: "attack",
    });
    return;
  }

  if (weaponType === "club" || weaponType === "mace" || weaponType === "axe") {
    addHint(hints, {
      id: "heavy-melee-attack",
      textKey: "thought.combatHint.heavyMeleeAttack",
      exampleKey: "thought.combatHint.example.heavyMeleeAttack",
      priority: 89,
      category: "attack",
    });
    return;
  }

  if (weaponType === "unarmed") {
    addHint(hints, {
      id: "unarmed-attack",
      textKey: "thought.combatHint.unarmedAttack",
      exampleKey: "thought.combatHint.example.unarmedAttack",
      priority: 88,
      category: "attack",
    });
    return;
  }

  addHint(hints, {
    id: "sword-attack",
    textKey: "thought.combatHint.swordAttack",
    exampleKey: "thought.combatHint.example.swordAttack",
    priority: 90,
    category: "attack",
  });
}

export function generateCombatThoughtHints(context: CombatHintContext): CombatThoughtHint[] {
  const hints: CombatThoughtHint[] = [];
  const postCombatState = context.postCombatState ?? "";

  if (POST_COMBAT_STATES.has(postCombatState)) {
    addHint(hints, {
      id: "post-combat-talk",
      textKey: postCombatState === "dead" || postCombatState === "enemyDead"
        ? "thought.combatHint.postCombatDead"
        : "thought.combatHint.postCombatAlive",
      exampleKey: postCombatState === "dead" || postCombatState === "enemyDead"
        ? "thought.combatHint.example.searchBody"
        : "thought.combatHint.example.demandSurrender",
      priority: 100,
      category: "postCombat",
    });
    return hints;
  }

  if (!canPlayerAct(context)) {
    addHint(hints, {
      id: "wait-turn",
      textKey: "thought.combatHint.waitTurn",
      priority: 100,
      category: "system",
    });
    return hints;
  }

  const weaponType = getWeaponType(context);

  if (isLow(context.player.currentHp, context.player.maxHp)) {
    addHint(hints, {
      id: "low-health-defense",
      textKey: "thought.combatHint.lowHealth",
      exampleKey: hasShield(context) ? "thought.combatHint.example.raiseShield" : "thought.combatHint.example.dodge",
      priority: 99,
      category: "resource",
    });
  }

  if (isLow(context.player.currentStamina, context.player.maxStamina)) {
    addHint(hints, {
      id: "low-stamina",
      textKey: "thought.combatHint.lowStamina",
      exampleKey: "thought.combatHint.example.guard",
      priority: 98,
      category: "resource",
    });
  }

  addWeaponAttackHint(hints, weaponType, context);

  if (hasShield(context)) {
    addHint(hints, {
      id: "raise-shield",
      textKey: "thought.combatHint.raiseShield",
      exampleKey: "thought.combatHint.example.raiseShield",
      priority: 83,
      category: "defense",
    });
  } else if (context.player.currentStamina > 0) {
    addHint(hints, {
      id: "dodge",
      textKey: "thought.combatHint.dodge",
      exampleKey: "thought.combatHint.example.dodge",
      priority: 78,
      category: "defense",
    });
  }

  if (!RANGED_WEAPON_TYPES.has(weaponType) && weaponType !== "unarmed" && context.player.currentStamina > 1) {
    addHint(hints, {
      id: "parry",
      textKey: "thought.combatHint.parry",
      exampleKey: "thought.combatHint.example.parry",
      priority: 74,
      category: "defense",
    });
  }

  if (canCastCombatFormula(context)) {
    addHint(hints, {
      id: "magic-fire-lance",
      textKey: "thought.combatHint.magicFireLance",
      exampleKey: "thought.combatHint.example.magicFireLance",
      priority: 82,
      category: "magic",
    });
  } else if (context.knownMagicWordIds.length > 0 && isLow(context.player.currentMana, context.player.maxMana)) {
    addHint(hints, {
      id: "low-mana",
      textKey: "thought.combatHint.lowMana",
      priority: 70,
      category: "resource",
    });
  }

  if (context.previousInputStatus === "unrecognized" || context.previousInputStatus === "invalid") {
    addHint(hints, {
      id: "clarify-action",
      textKey: "thought.combatHint.clarify",
      exampleKey: "thought.combatHint.example.swordAttack",
      priority: 97,
      category: "system",
    });
  }

  return hints.sort((left, right) => right.priority - left.priority).slice(0, MAX_HINTS);
}
