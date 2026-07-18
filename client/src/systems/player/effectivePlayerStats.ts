import type { InventoryState } from "../../types/inventory";
import type { Attributes, PlayerCharacter } from "../../types/player";

const ATTRIBUTE_KEYS: Array<keyof Attributes> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

function clampAttribute(value: number) {
  return Math.max(1, Math.min(30, Math.round(value)));
}

function getEquippedAttributeBonuses(inventory?: InventoryState): Partial<Attributes> {
  if (!inventory) {
    return {};
  }

  const equippedIds = new Set(Object.values(inventory.equipment).filter(Boolean));
  return inventory.items.reduce<Partial<Attributes>>((bonuses, item) => {
    if (!equippedIds.has(item.id) && (!item.instanceId || !equippedIds.has(item.instanceId))) {
      return bonuses;
    }

    for (const key of ATTRIBUTE_KEYS) {
      bonuses[key] = (bonuses[key] ?? 0) + (item.attributeBonuses?.[key] ?? 0);
    }

    return bonuses;
  }, {});
}

function getInjuryPenalties(player: PlayerCharacter): Partial<Attributes> {
  const penalties: Partial<Attributes> = {};

  for (const injury of player.textCombat?.injuries ?? []) {
    const amount = injury.severity === "severe" ? 2 : injury.severity === "moderate" ? 1 : 0;
    if (amount === 0) {
      continue;
    }

    if (injury.zone === "leftArm" || injury.zone === "rightArm" || injury.zone === "leftHand" || injury.zone === "rightHand") {
      penalties.strength = (penalties.strength ?? 0) - amount;
    } else if (injury.zone === "leftLeg" || injury.zone === "rightLeg" || injury.type === "knockdown") {
      penalties.dexterity = (penalties.dexterity ?? 0) - amount;
    } else if (injury.zone === "head" || injury.type === "concussion") {
      penalties.intelligence = (penalties.intelligence ?? 0) - amount;
      penalties.wisdom = (penalties.wisdom ?? 0) - amount;
    } else {
      penalties.constitution = (penalties.constitution ?? 0) - amount;
    }
  }

  return penalties;
}

function getActiveEffectModifiers(player: PlayerCharacter): Partial<Attributes> {
  const modifiers: Partial<Attributes> = {};

  for (const effect of player.magic?.activeEffects ?? []) {
    if (effect.effectType === "slowed") {
      modifiers.dexterity = (modifiers.dexterity ?? 0) - 2;
    } else if (effect.effectType === "hastened") {
      modifiers.dexterity = (modifiers.dexterity ?? 0) + 2;
    } else if (effect.effectType === "ward") {
      modifiers.constitution = (modifiers.constitution ?? 0) + 1;
    }
  }

  return modifiers;
}

/**
 * Resolves the only authoritative runtime view of player attributes.
 * `player.attributes` already contains creation allocation and racial bonuses;
 * transient equipment, effects and injuries are applied here exactly once.
 */
export function resolveEffectivePlayerStats(player: PlayerCharacter, inventory?: InventoryState): Attributes {
  const equipment = getEquippedAttributeBonuses(inventory);
  const effects = getActiveEffectModifiers(player);
  const injuries = getInjuryPenalties(player);

  return ATTRIBUTE_KEYS.reduce<Attributes>((resolved, key) => {
    resolved[key] = clampAttribute(
      player.attributes[key] + (equipment[key] ?? 0) + (effects[key] ?? 0) + (injuries[key] ?? 0),
    );
    return resolved;
  }, { ...player.attributes });
}

export function getPlayerCarryCapacity(player: PlayerCharacter, inventory?: InventoryState) {
  return Math.max(20, 30 + resolveEffectivePlayerStats(player, inventory).strength * 4);
}
