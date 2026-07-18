import type { CombatantState, WeaponType } from "../../types/combat";
import type { InventoryItem } from "../../types/inventory";
import { generateCombatThoughtHints, type CombatHintContext } from "./combatThoughtHints";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function combatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: "player",
    side: "player",
    entityType: "player",
    currentHp: 20,
    maxHp: 20,
    currentMana: 20,
    maxMana: 20,
    currentStamina: 10,
    maxStamina: 10,
    armorClass: 12,
    initiative: 0,
    dexterityModifier: 0,
    alive: true,
    conscious: true,
    canAct: true,
    lifeState: "active",
    statuses: [],
    ...overrides,
  };
}

function weapon(weaponType: WeaponType): Pick<InventoryItem, "id" | "templateId" | "weaponType" | "category"> {
  return {
    id: `${weaponType}-1`,
    templateId: `${weaponType}_template`,
    weaponType,
    category: "weapon",
  };
}

function baseContext(overrides: Partial<CombatHintContext> = {}): CombatHintContext {
  return {
    phase: "awaitingPlayerAction",
    player: combatant(),
    target: combatant({ id: "enemy", side: "enemy", entityType: "npc" }),
    knownMagicWordIds: [],
    availableFormulaIds: [],
    distance: "melee",
    activeCombatantId: "player",
    ...overrides,
  };
}

function ids(context: CombatHintContext) {
  return generateCombatThoughtHints(context).map((hint) => hint.id);
}

assert(ids(baseContext({ equippedWeapon: weapon("oneHandedSword") })).includes("sword-attack"), "Sword should suggest a melee sword attack.");
assert(ids(baseContext({ equippedWeapon: weapon("dagger") })).includes("dagger-stab"), "Dagger should suggest a close stab.");
assert(ids(baseContext({ equippedWeapon: weapon("spear"), distance: "reach" })).includes("spear-thrust"), "Spear at reach should suggest a thrust.");
assert(ids(baseContext({ equippedWeapon: weapon("spear"), distance: "veryClose" })).includes("spear-create-distance"), "Spear too close should suggest making room.");
assert(ids(baseContext()).includes("unarmed-attack"), "No equipped weapon should suggest an unarmed attack.");
assert(
  ids(baseContext({ offhandItem: { id: "shield-1", templateId: "shield", category: "shield", equipmentSlot: "shield" } })).includes("raise-shield"),
  "Shield should suggest raising the shield.",
);
assert(ids(baseContext({ equippedWeapon: weapon("club"), distance: "medium" })).includes("close-distance"), "Melee weapon at medium range should suggest closing distance.");
assert(
  ids(baseContext({
    knownMagicWordIds: ["ignis", "lancea", "hostis"],
    availableFormulaIds: ["fire_lance"],
  })).includes("magic-fire-lance"),
  "Known words and enough mana should suggest fire lance.",
);
assert(
  ids(baseContext({ equippedWeapon: weapon("lightCrossbow"), rangedWeaponLoaded: false, hasAmmo: true })).includes("ranged-reload-crossbow"),
  "Unloaded crossbow should suggest reload.",
);
assert(
  ids(baseContext({ equippedWeapon: weapon("lightCrossbow"), rangedWeaponLoaded: true, hasAmmo: true })).includes("ranged-shoot"),
  "Loaded crossbow should suggest shooting.",
);
assert(
  ids(baseContext({ equippedWeapon: weapon("shortBow"), hasAmmo: false })).includes("ranged-no-ammo"),
  "Bow without ammo should not suggest a shot.",
);
assert(
  ids(baseContext({ activeCombatantId: "enemy" })).includes("wait-turn"),
  "Enemy turn should only suggest waiting.",
);
assert(
  ids(baseContext({ postCombatState: "npcDefeatedAlive" })).includes("post-combat-talk"),
  "Post-combat defeated NPC should suggest dialogue or surrender demand.",
);
