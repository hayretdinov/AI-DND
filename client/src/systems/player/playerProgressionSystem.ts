import { createDefaultPlayerTraining } from "../../data/trainingData";
import type { CombatStats, PlayerTraining, WeaponType } from "../../types/combat";
import type { InventoryState } from "../../types/inventory";
import type { PlayerCharacter } from "../../types/player";
import { getAttributeModifier } from "../combat/diceSystem";

const PROFICIENCY_BONUS = 2;

function getArmorBonus(inventory?: InventoryState) {
  if (!inventory) {
    return 0;
  }

  return Object.values(inventory.equipment).reduce((total, itemId) => {
    const item = inventory.items.find((inventoryItem) => inventoryItem.id === itemId);

    return total + (item?.category === "armor" ? item.bonuses?.defense ?? item.stats?.defense ?? 0 : 0);
  }, 0);
}

export function normalizePlayerTraining(training?: Partial<PlayerTraining>): PlayerTraining {
  const fallback = createDefaultPlayerTraining();

  return {
    weapons: {
      ...fallback.weapons,
      ...(training?.weapons ?? {}),
    } as Record<WeaponType, boolean>,
    combat: {
      ...fallback.combat,
      ...(training?.combat ?? {}),
    },
  };
}

export function createPlayerCombatStats(
  player: PlayerCharacter,
  inventory?: InventoryState,
  existingCombat?: Partial<CombatStats>,
): CombatStats {
  const attributes = player.attributes;
  const constitutionModifier = getAttributeModifier(attributes.constitution);
  const dexterityModifier = getAttributeModifier(attributes.dexterity);
  const strengthModifier = getAttributeModifier(attributes.strength);
  const maxHealth = Math.max(1, 10 + constitutionModifier);
  const armorClass = 10 + dexterityModifier + getArmorBonus(inventory);
  const attackBonus = strengthModifier + PROFICIENCY_BONUS;
  const currentHealth = Number.isFinite(existingCombat?.currentHealth)
    ? Math.min(maxHealth, Math.max(1, Number(existingCombat?.currentHealth)))
    : maxHealth;

  return {
    maxHealth,
    currentHealth,
    armorClass,
    initiative: Number.isFinite(existingCombat?.initiative)
      ? Number(existingCombat?.initiative)
      : dexterityModifier,
    attackBonus,
    defenseBonus: Number.isFinite(existingCombat?.defenseBonus)
      ? Number(existingCombat?.defenseBonus)
      : armorClass - 10,
  };
}

export function normalizePlayerProgression(player: PlayerCharacter, inventory?: InventoryState): PlayerCharacter {
  const training = normalizePlayerTraining(player.training);
  const combat = createPlayerCombatStats({ ...player, training }, inventory, player.combat);

  return {
    ...player,
    training,
    combat,
  };
}
