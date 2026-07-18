import type { ActiveMagicEffect, PlayerMagicState, SpellDefinition } from "./magicTypes";

export function createMagicEffect(spell: SpellDefinition, remainingTurns = 3): ActiveMagicEffect | null {
  if (!spell.effectType) {
    return null;
  }

  return {
    id: `${spell.effectType}_${Date.now()}`,
    effectType: spell.effectType,
    sourceSpellId: spell.id,
    remainingTurns,
  };
}

export function addMagicEffect(magic: PlayerMagicState, effect: ActiveMagicEffect | null): PlayerMagicState {
  if (!effect) {
    return magic;
  }

  return {
    ...magic,
    activeEffects: [...magic.activeEffects, effect],
  };
}

export function tickMagicCooldowns(magic: PlayerMagicState): PlayerMagicState {
  return {
    ...magic,
    cooldowns: Object.fromEntries(
      Object.entries(magic.cooldowns)
        .map(([spellId, turns]): [string, number] => [spellId, Math.max(0, turns - 1)])
        .filter(([, turns]) => turns > 0),
    ),
    activeEffects: magic.activeEffects
      .map((effect) => ({ ...effect, remainingTurns: Math.max(0, effect.remainingTurns - 1) }))
      .filter((effect) => effect.remainingTurns > 0),
  };
}
