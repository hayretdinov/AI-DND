import type { GameSave } from "../save/saveSystem";
import type { NpcInstance } from "../../types/npc";
import { rollD20, rollDice } from "../combat/diceSystem";
import { normalizeNpcCombatState } from "../combat/combatSystem";
import { markNpcDefeatedAfterCombat } from "../combat/postCombatSystem";
import { markResourceSpent } from "../resources/resourceRegeneration";
import { recordMagicAttempt } from "./magicProgression";
import type { MagicValidationResult, SpellResolutionResult } from "./magicTypes";

type SpellResolverContext = {
  npcInstance?: NpcInstance | null;
};

export function resolveSpell(
  save: GameSave,
  validation: MagicValidationResult,
  context: SpellResolverContext,
): { save: GameSave; npcInstance?: NpcInstance | null; result: SpellResolutionResult } {
  if (!validation.ok) {
    const magic = save.player.magic;

    return {
      save: magic
        ? {
            ...save,
            player: {
              ...save.player,
              magic: recordMagicAttempt(magic, validation.parsedFormula?.knownWordIds ?? [], false),
            },
          }
        : save,
      npcInstance: context.npcInstance,
      result: {
        ok: false,
        validation,
        narrationKey: validation.messageKey,
        manaSpent: 0,
      },
    };
  }

  const magic = save.player.magic!;
  const roll = rollD20();
  const critical = roll === 20;
  const fumble = roll === 1;
  const success = critical || (!fumble && roll + magic.magicLevel >= validation.spell.difficultyClass);
  const manaSpent = validation.manaCost;
  const nextMagicBase = recordMagicAttempt(
    {
      ...magic,
      mana: Math.max(0, magic.mana - manaSpent),
      cooldowns: {
        ...magic.cooldowns,
        [validation.spell.id]: validation.spell.cooldownTurns ?? 0,
      },
    },
    validation.parsedFormula.knownWordIds,
    success,
  );

  if (!success) {
    const failedSave = markResourceSpent({
      ...save,
      player: {
        ...save.player,
        magic: {
          ...nextMagicBase,
          instability: nextMagicBase.instability + (fumble ? 2 : 1),
        },
      },
    }, "mana");

    return {
      save: failedSave,
      npcInstance: context.npcInstance,
      result: {
        ok: false,
        validation,
        narrationKey: fumble ? "magic.message.criticalFailure" : "magic.message.castFailed",
        manaSpent,
        fumble,
        roll,
      },
    };
  }

  let nextNpc = context.npcInstance ?? null;
  let damage = 0;
  let healing = 0;
  let nextPlayer = {
    ...save.player,
    magic: nextMagicBase,
  };

  if (validation.spell.damageDice && nextNpc) {
    const npcCombat = normalizeNpcCombatState(nextNpc.templateId, nextNpc.role, nextNpc.combat);
    damage = Math.max(1, rollDice(validation.spell.damageDice) + Math.max(0, magic.magicLevel - 1));
    damage = critical ? damage * 2 : damage;
    const nextHealth = Math.max(0, npcCombat.currentHealth - damage);
    const damagedNpc = {
      ...nextNpc,
      combat: {
        ...npcCombat,
        currentHealth: nextHealth,
        damageType: validation.spell.damageType ?? npcCombat.damageType,
        isDefeated: nextHealth <= 0,
        lifeState: nextHealth <= 0 ? (nextNpc.role === "monster" ? "dead" : "defeated") : npcCombat.lifeState,
      },
    };
    nextNpc = nextHealth <= 0 ? markNpcDefeatedAfterCombat(damagedNpc, save.player.id) : damagedNpc;
  }

  if (validation.spell.healingDice && save.player.combat) {
    healing = Math.max(1, rollDice(validation.spell.healingDice) + Math.max(0, magic.magicLevel - 1));
    nextPlayer = {
      ...nextPlayer,
      combat: {
        ...save.player.combat,
        currentHealth: Math.min(save.player.combat.maxHealth, save.player.combat.currentHealth + healing),
      },
    };
  }

  if (validation.spell.effectType) {
    nextPlayer = {
      ...nextPlayer,
      magic: {
        ...nextPlayer.magic!,
        activeEffects: [
          ...nextPlayer.magic!.activeEffects,
          {
            id: `${validation.spell.effectType}_${Date.now()}`,
            effectType: validation.spell.effectType,
            sourceSpellId: validation.spell.id,
            remainingTurns: 3,
          },
        ],
      },
    };
  }

  return {
    save: markResourceSpent({
      ...save,
      player: nextPlayer,
    }, "mana"),
    npcInstance: nextNpc,
    result: {
      ok: true,
      validation,
      narrationKey: "magic.message.castSucceeded",
      manaSpent,
      damage,
      healing,
      critical,
      roll,
    },
  };
}
