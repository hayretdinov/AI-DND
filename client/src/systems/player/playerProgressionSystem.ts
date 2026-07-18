import { createDefaultPlayerTraining } from "../../data/trainingData";
import type { CombatStats, PlayerTraining, WeaponType } from "../../types/combat";
import type { InventoryState } from "../../types/inventory";
import type { PlayerCharacter } from "../../types/player";
import { getAttributeModifier } from "../combat/diceSystem";
import { resolveEffectivePlayerStats } from "./effectivePlayerStats";

const PROFICIENCY_BONUS = 2;

function getArmorBonus(inventory?: InventoryState) {
  if (!inventory) {
    return 0;
  }

  return Object.values(inventory.equipment).reduce((total, itemId) => {
    const item = inventory.items.find((inventoryItem) => inventoryItem.id === itemId);
    const itemDefense =
      item?.armorValue ??
      item?.bonuses?.defense ??
      item?.stats?.defense ??
      0;

    return total + itemDefense;
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
  const attributes = resolveEffectivePlayerStats(player, inventory);
  const constitutionModifier = getAttributeModifier(attributes.constitution);
  const dexterityModifier = getAttributeModifier(attributes.dexterity);
  const strengthModifier = getAttributeModifier(attributes.strength);
  const maxHealth = Math.max(1, 10 + constitutionModifier * 2);
  const maxStamina = Math.max(1, 10 + constitutionModifier + strengthModifier);
  const armorClass = 10 + dexterityModifier + getArmorBonus(inventory);
  const attackBonus = strengthModifier + PROFICIENCY_BONUS;
  const minimumHealth = player.lifeState === "dead" ? 0 : 1;
  const previousMaxHealth = Number(existingCombat?.maxHealth);
  const currentHealth = Number.isFinite(existingCombat?.currentHealth)
    ? Math.min(maxHealth, Math.max(minimumHealth, Number(existingCombat?.currentHealth) * (
        Number.isFinite(previousMaxHealth) && previousMaxHealth > 0 ? maxHealth / previousMaxHealth : 1
      )))
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
  const effectiveAttributes = resolveEffectivePlayerStats(player, inventory);
  const maxStamina = Math.max(
    1,
    10 + getAttributeModifier(effectiveAttributes.constitution) + getAttributeModifier(effectiveAttributes.strength),
  );
  const lifeState = player.lifeState === "dead"
    ? "dead"
    : player.lifeState === "robbed"
      ? "robbed"
      : player.lifeState === "defeated"
        ? "defeated"
        : "active";
  const previousMaxStamina = player.textCombat?.maxStamina ?? maxStamina;
  const currentStamina = player.textCombat
    ? Math.min(maxStamina, Math.max(0, player.textCombat.stamina * (previousMaxStamina > 0 ? maxStamina / previousMaxStamina : 1)))
    : maxStamina;

  return {
    ...player,
    training,
    combat,
    textCombat: player.textCombat ? {
      ...player.textCombat,
      maxStamina,
      stamina: currentStamina,
    } : player.textCombat,
    lifeState,
    derivedStats: {
      ...player.derivedStats,
      health: combat.maxHealth,
      stamina: maxStamina,
      armorClass: combat.armorClass,
    },
  };
}

export function recalculatePlayerDefense(player: PlayerCharacter, inventory?: InventoryState): PlayerCharacter {
  const nextPlayer = normalizePlayerProgression(player, inventory);

  console.info("[Outfit] player stage changed", {
    outfitStage: nextPlayer.currentOutfitStage,
    armorClass: nextPlayer.combat?.armorClass,
    defenseBonus: nextPlayer.combat?.defenseBonus,
  });

  return nextPlayer;
}
