import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultInventoryState } from "../src/data/inventoryMockData";
import { getNpcById } from "../src/data/npcs";
import {
  addPlayerExperience,
  createDefaultPlayerProgression,
  getExperienceRequiredForNextLevel,
  normalizePlayerProgressionState,
  spendPlayerSkillPoints,
} from "../src/systems/progression/playerProgressionSystem";
import {
  grantCombatVictoryExperience,
  grantLocationDiscoveryExperience,
  grantQuestCompletionExperience,
  grantSocialCheckExperience,
} from "../src/systems/progression/progressionRewards";
import { loadGame, saveGame, type GameSave } from "../src/systems/save/saveSystem";
import { applyTrainerTraining } from "../src/systems/trainers/trainerSystem";

function createSave(options?: {
  level?: number;
  experience?: number;
  skillPoints?: number;
  gold?: number;
  learnedMeleeBasic?: boolean;
}): GameSave {
  const inventory = createDefaultInventoryState();
  inventory.gold = options?.gold ?? 100;

  return {
    player: {
      id: "test_player",
      name: "Tester",
      origin: "outcast",
      race: "human",
      gender: "male",
      characterClass: "warrior",
      appearance: "wanderer",
      currentOutfitStage: "rags",
      portraitUrl: "",
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      derivedStats: {
        health: 100,
        stamina: 50,
        armorClass: 10,
      },
      progression: {
        ...createDefaultPlayerProgression(),
        level: options?.level ?? 1,
        experience: options?.experience ?? 0,
        skillPoints: options?.skillPoints ?? 0,
      },
      trainerProgression: {
        spentSkillPoints: 0,
        learnedTiers: options?.learnedMeleeBasic ? { melee: ["basic"] } : {},
        freeBasicTrainerIds: options?.learnedMeleeBasic ? ["edgar_swordmaster"] : [],
        receivedGuideItemIds: [],
        trainerAgreements: {},
      },
      createdAt: new Date(0).toISOString(),
    },
    inventory,
  };
}

describe("player progression", () => {
  it("creates a new player at level 1 with no XP or skill points", () => {
    expect(createDefaultPlayerProgression()).toMatchObject({
      level: 1,
      experience: 0,
      skillPoints: 0,
    });
  });

  it("uses the configured linear XP formula", () => {
    expect(getExperienceRequiredForNextLevel(1)).toBe(100);
    expect(getExperienceRequiredForNextLevel(2)).toBe(150);
    expect(getExperienceRequiredForNextLevel(5)).toBe(300);
  });

  it("does not level up from 50 XP", () => {
    const result = addPlayerExperience(createSave(), 50, "test", "xp:50");

    expect(result.levelAfter).toBe(1);
    expect(result.experience).toBe(50);
    expect(result.skillPointsGained).toBe(0);
  });

  it("levels up at 100 XP and awards one skill point", () => {
    const result = addPlayerExperience(createSave(), 100, "test", "xp:100");

    expect(result.levelAfter).toBe(2);
    expect(result.experience).toBe(0);
    expect(result.skillPointsGained).toBe(1);
    expect(result.save.player.progression?.skillPoints).toBe(1);
  });

  it("carries excess XP and can grant multiple levels", () => {
    const result = addPlayerExperience(
      createSave({ experience: 90 }),
      180,
      "large reward",
      "xp:large",
    );

    expect(result.levelAfter).toBe(3);
    expect(result.levelsGained).toBe(2);
    expect(result.skillPointsGained).toBe(2);
    expect(result.experience).toBe(20);
  });

  it("rejects negative XP and duplicate source IDs", () => {
    const save = createSave();
    const negative = addPlayerExperience(save, -10, "invalid", "xp:negative");
    const first = addPlayerExperience(save, 25, "reward", "xp:once");
    const duplicate = addPlayerExperience(first.save, 25, "reward", "xp:once");

    expect(negative.granted).toBe(false);
    expect(negative.save.player.progression?.experience).toBe(0);
    expect(first.granted).toBe(true);
    expect(duplicate.granted).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.save.player.progression?.experience).toBe(25);
  });

  it("spends skill points once per transaction", () => {
    const save = createSave({ skillPoints: 2 });
    const first = spendPlayerSkillPoints(save, 1, "training", "training:one");
    const duplicate = spendPlayerSkillPoints(first.save, 1, "training", "training:one");

    expect(first.success).toBe(true);
    expect(first.save.player.progression?.skillPoints).toBe(1);
    expect(duplicate.success).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.save.player.progression?.skillPoints).toBe(1);
  });
});

describe("structured progression rewards", () => {
  it("awards configured combat XP only for a victory", () => {
    const forestBeast = getNpcById("forest_beast_01");
    const bandit = getNpcById("hooded_bandit_01");
    const defeated = grantCombatVictoryExperience(createSave(), "loss", forestBeast, false);
    const beastVictory = grantCombatVictoryExperience(createSave(), "beast-1", forestBeast, true);
    const banditVictory = grantCombatVictoryExperience(createSave(), "bandit-1", bandit, true);

    expect(defeated.granted).toBe(false);
    expect(beastVictory.amount).toBe(forestBeast?.experienceReward);
    expect(banditVictory.amount).toBe(bandit?.experienceReward);
  });

  it("blocks reopening a victory but allows a new combat id", () => {
    const enemy = getNpcById("hooded_bandit_01");
    const first = grantCombatVictoryExperience(createSave(), "combat-a", enemy, true);
    const reopened = grantCombatVictoryExperience(first.save, "combat-a", enemy, true);
    const nextCombat = grantCombatVictoryExperience(reopened.save, "combat-b", enemy, true);

    expect(first.granted).toBe(true);
    expect(reopened.granted).toBe(false);
    expect(reopened.duplicate).toBe(true);
    expect(nextCombat.granted).toBe(true);
  });

  it("awards quest, discovery, and social XP once per structured source", () => {
    const quest = grantQuestCompletionExperience(createSave(), "quest-a", 50);
    const repeatedQuest = grantQuestCompletionExperience(quest.save, "quest-a", 50);
    const discovery = grantLocationDiscoveryExperience(repeatedQuest.save, "swamp", 20);
    const repeatedDiscovery = grantLocationDiscoveryExperience(discovery.save, "swamp", 20);
    const social = grantSocialCheckExperience(repeatedDiscovery.save, "gate-a", "success");
    const repeatedSocial = grantSocialCheckExperience(social.save, "gate-a", "criticalSuccess");

    expect(quest.granted).toBe(true);
    expect(repeatedQuest.granted).toBe(false);
    expect(discovery.granted).toBe(true);
    expect(repeatedDiscovery.granted).toBe(false);
    expect(social.granted).toBe(true);
    expect(repeatedSocial.granted).toBe(false);
  });
});

describe("trainer integration", () => {
  it("blocks training without skill points, gold, or the required player level", () => {
    const noPoints = applyTrainerTraining(
      createSave({ level: 3, skillPoints: 0, gold: 100, learnedMeleeBasic: true }),
      "edgar_swordmaster",
    );
    const noGold = applyTrainerTraining(
      createSave({ level: 3, skillPoints: 1, gold: 0, learnedMeleeBasic: true }),
      "edgar_swordmaster",
    );
    const lowLevel = applyTrainerTraining(
      createSave({ level: 2, skillPoints: 1, gold: 100, learnedMeleeBasic: true }),
      "edgar_swordmaster",
    );

    expect(noPoints.ok).toBe(false);
    expect(noPoints.messageKey).toBe("trainer.message.notEnoughSkillPoints");
    expect(noGold.ok).toBe(false);
    expect(noGold.messageKey).toBe("trainer.message.notEnoughGold");
    expect(lowLevel.ok).toBe(false);
    expect(lowLevel.messageKey).toBe("trainer.message.levelTooLow");
  });

  it("requires the previous training tier", () => {
    const result = applyTrainerTraining(
      createSave({ level: 12, skillPoints: 5, gold: 500 }),
      "general_vargas",
    );

    expect(result.ok).toBe(false);
    expect(result.messageKey).toBe("trainer.message.prerequisiteMissing");
  });

  it("atomically spends resources and advances the learned tier", () => {
    const save = createSave({ level: 3, skillPoints: 1, gold: 100, learnedMeleeBasic: true });
    const result = applyTrainerTraining(save, "edgar_swordmaster");

    expect(result.ok).toBe(true);
    expect(result.save.player.progression?.skillPoints).toBe(0);
    expect(result.save.inventory?.gold).toBe(75);
    expect(result.save.player.trainerProgression?.learnedTiers.melee).toContain("intermediate");

    const repeated = applyTrainerTraining(result.save, "edgar_swordmaster");
    expect(repeated.ok).toBe(false);
    expect(repeated.save.inventory?.gold).toBe(75);
    expect(repeated.save.player.progression?.skillPoints).toBe(0);
  });
});

describe("save migration and persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("migrates old trainer skill points into the central progression state", () => {
    expect(normalizePlayerProgressionState(undefined, 4)).toMatchObject({
      level: 1,
      experience: 0,
      skillPoints: 4,
      processedRewardIds: [],
      processedTransactionIds: [],
    });
  });

  it("preserves progression through the existing save and load functions", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    const rewarded = addPlayerExperience(createSave(), 120, "persistence", "xp:persistence");

    saveGame(rewarded.save);
    const loaded = loadGame();

    expect(loaded?.player.progression).toMatchObject({
      level: 2,
      experience: 20,
      skillPoints: 1,
    });
  });
});
