import type { GameSave } from "../save/saveSystem";
import { createDefaultMagicState, learnMagicWord, learnSpellFormula } from "./magicProgression";
import { parseMagicFormula } from "./magicParser";
import { validateMagicFormula } from "./magicValidator";

const baseSave = {
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
    magic: createDefaultMagicState("mage"),
    createdAt: new Date(0).toISOString(),
  },
} satisfies GameSave;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runMagicValidatorSelfTest() {
  const trainedMagic = learnSpellFormula(
    ["lancea", "hostis"].reduce((magic, wordId) => learnMagicWord(magic, wordId, "understood", "arkel_magister"), baseSave.player.magic),
    "fire_lance",
    ["ignis", "lancea", "hostis"],
    "arkel_magister",
  );
  const trainedSave = {
    ...baseSave,
    player: {
      ...baseSave.player,
      magic: trainedMagic,
    },
  };
  const success = validateMagicFormula(baseSave, parseMagicFormula("Игнис Манус Минора"), {
    inCombat: false,
    hasTarget: false,
  });
  const fireLance = validateMagicFormula(trainedSave, parseMagicFormula("Игнис Ланца Хостис"), {
    inCombat: true,
    hasTarget: true,
  });
  const noMana = validateMagicFormula({
    ...baseSave,
    player: {
      ...baseSave.player,
      magic: {
        ...baseSave.player.magic,
        mana: 0,
      },
    },
  }, parseMagicFormula("Игнис Манус Минора"), {
    inCombat: false,
    hasTarget: false,
  });
  const missingTarget = validateMagicFormula(baseSave, parseMagicFormula("Игнис Ланца Хостис"), {
    inCombat: true,
    hasTarget: false,
  });

  assert(success.ok, "Known starter formula should validate.");
  assert(fireLance.ok && fireLance.spell.id === "fire_lance", "Arkel's known combat formula should validate as fire_lance.");
  assert(!noMana.ok && noMana.reason === "insufficient_mana", "Validator must block insufficient mana.");
  assert(!missingTarget.ok && missingTarget.reason !== "not_magic_user", "Validator must reject unavailable target or mastery.");
}
