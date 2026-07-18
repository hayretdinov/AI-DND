import type { GameSave } from "../save/saveSystem";
import type { NpcInstance } from "../../types/npc";
import { createDefaultMagicState, learnMagicWord, learnSpellFormula } from "./magicProgression";
import { parseMagicFormula } from "./magicParser";
import { resolveSpell } from "./spellResolver";
import { validateMagicFormula } from "./magicValidator";

function createSave(): GameSave {
  return {
    player: {
      id: "test-player",
      name: "Test",
      origin: "scholar",
      race: "human",
      gender: "male",
      characterClass: "mage",
      appearance: "wanderer",
      currentOutfitStage: "rags",
      portraitUrl: "",
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 14,
        wisdom: 12,
        charisma: 10,
      },
      derivedStats: {
        health: 10,
        stamina: 10,
        armorClass: 10,
      },
      combat: {
        maxHealth: 10,
        currentHealth: 5,
        armorClass: 10,
        initiative: 0,
        attackBonus: 0,
        defenseBonus: 0,
      },
      magic: createDefaultMagicState("mage"),
      createdAt: new Date(0).toISOString(),
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runSpellResolverSelfTest() {
  const save = createSave();
  const validation = validateMagicFormula(save, parseMagicFormula("Игнис Манус Минора"), {
    inCombat: false,
    hasTarget: false,
  });
  const resolved = resolveSpell(save, validation, {});

  assert(resolved.save.player.magic!.mana < save.player.magic!.mana, "Resolver must spend mana.");
  assert(resolved.result.manaSpent > 0, "Resolver must report spent mana.");

  const trainedMagic = learnSpellFormula(
    ["lancea", "hostis"].reduce((magic, wordId) => learnMagicWord(magic, wordId, "understood", "arkel_magister"), save.player.magic!),
    "fire_lance",
    ["ignis", "lancea", "hostis"],
    "arkel_magister",
  );
  const combatSave = {
    ...save,
    player: {
      ...save.player,
      magic: trainedMagic,
    },
  };
  const target: NpcInstance = {
    instanceId: "bandit-1",
    templateId: "bandit_erik",
    role: "bandit",
    status: "alive",
    npcId: "bandit_erik",
    met: true,
    relationship: 0,
    trust: 0,
    fear: 0,
    hostility: 50,
    dialogueHistory: [],
    createdAt: new Date(0).toISOString(),
    combat: {
      maxHealth: 12,
      currentHealth: 12,
      armorClass: 10,
      attackBonus: 0,
      damageDice: "1d4",
      damageType: "bludgeoning",
      isDefeated: false,
    },
  };
  const originalRandom = Math.random;
  Math.random = () => 0.95;

  try {
    const fireLanceValidation = validateMagicFormula(combatSave, parseMagicFormula("Игнис Ланца Хостис"), {
      inCombat: true,
      hasTarget: true,
    });
    const fireLanceResolved = resolveSpell(combatSave, fireLanceValidation, { npcInstance: target });

    assert(fireLanceResolved.result.ok, "Fire lance should resolve as a successful hit with deterministic roll.");
    assert((fireLanceResolved.npcInstance?.combat?.currentHealth ?? 12) < 12, "Fire lance must mutate target HP on hit.");
    assert(fireLanceResolved.save.player.magic!.mana < combatSave.player.magic!.mana, "Fire lance must spend mana.");
  } finally {
    Math.random = originalRandom;
  }
}
