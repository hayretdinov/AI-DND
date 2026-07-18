import { useEffect, useState } from "react";
import { CharacterCreation } from "./screens/CharacterCreation";
import { CampScene } from "./screens/CampScene";
import { CityMapScene } from "./screens/CityMapScene";
import { EventScene } from "./screens/EventScene";
import { Inventory } from "./screens/Inventory";
import { Journal } from "./screens/Journal";
import { MainMenu } from "./screens/MainMenu";
import { Settings } from "./screens/Settings";
import { SwampMapScene } from "./screens/SwampMapScene";
import { WorldMap } from "./screens/WorldMap";
import { createInitialAnarielCompanionState, hasSave, isGameOverSave, loadGame, saveGame } from "./systems/save/saveSystem";
import { addPlayerGold } from "./systems/save/saveSystem";
import { getTravelEventById, TRAVEL_EVENT_CHANCE } from "./data/travelEvents";
import { getRoyalCourtEventId, getRoyalCourtNpcById } from "./data/royalCourtNpcs";
import { isItemId, type ItemId } from "./data/itemRegistry";
import { getLanguage, setLanguage } from "./i18n/i18n";
import { createDefaultMagicState, learnMagicWord, parseMagicFormula, type MagicMasteryLevel } from "./systems/magic";
import {
  addUniqueInventoryItem,
  ARCHERY_BASICS_GUIDE_ITEM_ID,
  createInventoryItemFromTemplate,
  CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
  MAGIC_APPRENTICE_GUIDE_ITEM_ID,
  MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
  removeInventoryItemByTemplateId,
} from "./systems/inventory/readableItems";
import { normalizeTrainerProgression } from "./systems/trainers/trainerSystem";
import {
  createDefaultPlayerTextCombatState,
  parseTextCombatAction,
  type CombatDistance,
  type CombatInjury,
  type CombatStance,
  type CombatTechniqueId,
} from "./systems/combat/text";
import { parseRangedCombatAction } from "./systems/combat/ranged";
import {
  applyBlacksmithTraining,
  applySmithingClick,
  createDefaultSmithingProgression,
  startSmithingJob,
} from "./systems/smithing/smithingSystem";
import type { Language } from "./i18n/languages";
import type { InventoryReturnTarget, ScreenName } from "./types/navigation";

function inventoryTargetToScreen(target: InventoryReturnTarget): ScreenName {
  if (target === "merchantScene") {
    return "eventScene";
  }

  if (target === "characterCreation") {
    return "characterCreation";
  }

  return target;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("mainMenu");
  const [saveVersion, setSaveVersion] = useState(0);
  const [language, setLanguageState] = useState<Language>(() => getLanguage());
  const [lastInventorySource, setLastInventorySource] = useState<InventoryReturnTarget | null>(null);
  const [lastActiveScene, setLastActiveScene] = useState<InventoryReturnTarget>("worldMap");

  const backToMenu = () => setScreen("mainMenu");
  const refreshSaveState = () => setSaveVersion((version) => version + 1);
  const openScreen = (nextScreen: ScreenName) => {
    if (nextScreen !== "inventory" && nextScreen !== "journal" && nextScreen !== "settings" && nextScreen !== "mainMenu") {
      setLastActiveScene(nextScreen === "eventScene" ? "eventScene" : nextScreen);
    }

    setScreen(nextScreen);
  };
  const openInventory = (source: InventoryReturnTarget) => {
    setLastInventorySource(source);
    setLastActiveScene(source);
    setScreen("inventory");
  };
  const closeInventory = () => {
    const target = lastInventorySource ?? lastActiveScene;

    refreshSaveState();
    setScreen(inventoryTargetToScreen(target));
  };
  const openMapFromInventory = () => {
    const save = loadGame();
    const source = lastInventorySource ?? lastActiveScene;
    const shouldOpenCityMap =
      source === "cityMap" ||
      source === "merchantScene" ||
      (source === "eventScene" && Boolean(save?.activeEvent?.cityId));
    const shouldOpenSwampMap =
      source === "swampMap" ||
      (source === "eventScene" && save?.activeEvent?.returnTo === "swampMap") ||
      save?.currentLocationId === "swamp_location";

    refreshSaveState();
    setScreen(shouldOpenCityMap ? "cityMap" : shouldOpenSwampMap ? "swampMap" : "worldMap");
  };
  const continueGame = () => {
    const save = loadGame();

    if (!save || isGameOverSave(save)) {
      refreshSaveState();
      openScreen("mainMenu");
      return;
    }

    openScreen("worldMap");
  };
  const startIntroScene = () => {
    const save = loadGame();

    if (save) {
      saveGame({
        ...save,
        companions: {
          ...save.companions,
          anariel: createInitialAnarielCompanionState(),
        },
        currentLocationId: "necropolis_skull_castle",
        activeEvent: {
          eventId: "anariel_intro",
          returnTo: "worldMap",
        },
      });
    }

    refreshSaveState();
    openScreen("eventScene");
  };
  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hostname !== "localhost") {
      return;
    }

    const debugWindow = window as Window & {
      __AI_DND_DEBUG__?: Record<string, unknown> & {
        openNpc?: (npcId: string) => boolean;
        grantMagicWord?: (wordId: string, masteryLevel?: MagicMasteryLevel) => boolean;
        restoreMana?: () => boolean;
        unlockGrimoire?: () => boolean;
        parseMagic?: (text: string) => unknown;
        parseCombatAction?: (text: string) => unknown;
        parseRangedCombatAction?: (text: string) => unknown;
        giveMagicApprenticeGuide?: () => boolean;
        giveMeleeCombatBeginnerGuide?: () => boolean;
        giveArcheryBasicsGuide?: () => boolean;
        giveCrossbowAndBoltsGuide?: () => boolean;
        grantTrainerSkillPoints?: (amount?: number) => boolean;
        giveLightCrossbow?: () => boolean;
        giveCommonCrossbowBolts?: (quantity?: number) => boolean;
        giveItem?: (itemId: string, quantity?: number) => boolean;
        giveNewTaskItems?: () => boolean;
        openCentralBlacksmith?: () => boolean;
        grantSmithingTraining?: () => boolean;
        resetSmithingTraining?: () => boolean;
        openSmithingMiniGame?: () => boolean;
        completeSmithingMiniGame?: () => boolean;
        addGold?: (amount?: number) => boolean;
        spawnBanditErik?: () => boolean;
        spawnOrcBanditMilka?: () => boolean;
        forceTravelEvent?: (eventId?: string) => boolean;
        getTravelEventChance?: () => number;
        removeMeleeCombatBeginnerGuide?: () => boolean;
        restoreCombatStamina?: () => boolean;
        grantCombatTechnique?: (techniqueId: CombatTechniqueId) => boolean;
        setCombatDistance?: (distance: CombatDistance) => boolean;
        setCombatStance?: (stance: CombatStance) => boolean;
        applyCombatInjury?: (injury: CombatInjury) => boolean;
        clearCombatInjuries?: () => boolean;
      };
    };
    const previousDebug = debugWindow.__AI_DND_DEBUG__;
    const newTaskItemIds: ItemId[] = [
      "spear",
      "armor_piercing_arrows",
      "simple_bow",
      "light_crossbow",
      "simple_arrows",
      "wooden_club",
      "old_dagger",
      "steel_sword",
      "steel_mace",
      "iron_mace",
      "iron_sword",
    ];
    const addDebugItem = (itemId: string, quantity = 1) => {
      const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
      const save = loadGame();

      if (!isDev || !save || !isItemId(itemId)) {
        return false;
      }

      const item = createInventoryItemFromTemplate(itemId, Math.max(1, Math.floor(quantity)), "debug");

      if (!item) {
        return false;
      }

      saveGame({
        ...save,
        inventory: {
          ...(save.inventory ?? { items: [], equipment: {}, gold: 0, maxCarryWeight: 100 }),
          items: [...(save.inventory?.items ?? []), item],
        },
      });
      refreshSaveState();
      return true;
    };
    const forceDebugTravelEvent = (eventId = "travel_bandit_erik") => {
      const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
      const save = loadGame();
      const event = getTravelEventById(eventId);

      if (!isDev || !save || !event) {
        return false;
      }

      saveGame({
        ...save,
        activeEvent: {
          eventId: event.id,
          npcId: event.npcId,
          npcTemplateId: event.npcId,
          returnTo: "worldMap",
        },
      });
      refreshSaveState();
      setScreen("eventScene");
      return true;
    };

    debugWindow.__AI_DND_DEBUG__ = {
      ...(previousDebug ?? {}),
      openNpc: (npcId: string) => {
        const npc = getRoyalCourtNpcById(npcId);
        const save = loadGame();

        if (!npc || !save) {
          console.warn("[AI-DND DEBUG] Cannot open NPC", { npcId, hasSave: Boolean(save) });
          return false;
        }

        saveGame({
          ...save,
          currentLocationId: "western_great_city",
          activeEvent: {
            eventId: getRoyalCourtEventId(npc.id),
            npcId: npc.id,
            npcTemplateId: npc.id,
            npcInstanceId: npc.id,
            returnTo: "worldMap",
          },
        });
        refreshSaveState();
        setScreen("eventScene");
        return true;
      },
      grantMagicWord: (wordId: string, masteryLevel: MagicMasteryLevel = "understood") => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const magic = save.player.magic ?? createDefaultMagicState(save.player.characterClass);
        const nextMagic = learnMagicWord({ ...magic, canUseMagic: true, grimoireUnlocked: true }, wordId, masteryLevel, "debug");

        saveGame({
          ...save,
          player: {
            ...save.player,
            magic: nextMagic,
          },
        });
        refreshSaveState();
        return true;
      },
      restoreMana: () => {
        const save = loadGame();

        if (!save?.player.magic) {
          return false;
        }

        saveGame({
          ...save,
          player: {
            ...save.player,
            magic: {
              ...save.player.magic,
              mana: save.player.magic.maxMana,
            },
          },
        });
        refreshSaveState();
        return true;
      },
      unlockGrimoire: () => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        saveGame({
          ...save,
          player: {
            ...save.player,
            magic: {
              ...(save.player.magic ?? createDefaultMagicState(save.player.characterClass)),
              grimoireUnlocked: true,
            },
          },
        });
        refreshSaveState();
        return true;
      },
      parseMagic: (text: string) => parseMagicFormula(text),
      parseCombatAction: (text: string) => parseTextCombatAction(text),
      parseRangedCombatAction: (text: string) => parseRangedCombatAction(text),
      giveMagicApprenticeGuide: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(addUniqueInventoryItem(save, MAGIC_APPRENTICE_GUIDE_ITEM_ID, "debug"));
        refreshSaveState();
        return true;
      },
      giveMeleeCombatBeginnerGuide: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(addUniqueInventoryItem(save, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID, "debug"));
        refreshSaveState();
        return true;
      },
      giveArcheryBasicsGuide: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(addUniqueInventoryItem(save, ARCHERY_BASICS_GUIDE_ITEM_ID, "debug"));
        refreshSaveState();
        return true;
      },
      giveCrossbowAndBoltsGuide: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(addUniqueInventoryItem(save, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID, "debug"));
        refreshSaveState();
        return true;
      },
      grantTrainerSkillPoints: (amount = 5) => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        const progression = normalizeTrainerProgression(save.player.trainerProgression);

        saveGame({
          ...save,
          player: {
            ...save.player,
            trainerProgression: {
              ...progression,
              skillPoints: progression.skillPoints + Math.max(1, Math.floor(amount)),
            },
          },
        });
        refreshSaveState();
        return true;
      },
      giveLightCrossbow: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();
        const item = createInventoryItemFromTemplate("light_crossbow", 1, "debug");

        if (!isDev || !save || !item) {
          return false;
        }

        saveGame({
          ...save,
          inventory: {
            ...(save.inventory ?? { items: [], equipment: {}, gold: 0, maxCarryWeight: 100 }),
            items: [...(save.inventory?.items ?? []), item],
          },
        });
        refreshSaveState();
        return true;
      },
      giveCommonCrossbowBolts: (quantity = 10) => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();
        const item = createInventoryItemFromTemplate("common_crossbow_bolt", Math.max(1, Math.floor(quantity)), "debug");

        if (!isDev || !save || !item) {
          return false;
        }

        saveGame({
          ...save,
          inventory: {
            ...(save.inventory ?? { items: [], equipment: {}, gold: 0, maxCarryWeight: 100 }),
            items: [...(save.inventory?.items ?? []), item],
          },
        });
        refreshSaveState();
        return true;
      },
      giveItem: (itemId: string, quantity = 1) => addDebugItem(itemId, quantity),
      giveNewTaskItems: () => newTaskItemIds.every((itemId) => addDebugItem(itemId, itemId.includes("arrows") ? 12 : 1)),
      openCentralBlacksmith: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame({
          ...save,
          currentLocationId: "central_settlement",
          activeEvent: {
            eventId: "central_blacksmith_dultran",
            npcId: "central_blacksmith_dultran",
            npcTemplateId: "central_blacksmith_dultran",
            npcInstanceId: "central_blacksmith_dultran",
            returnTo: "cityMap",
            cityId: "central_settlement",
          },
        });
        refreshSaveState();
        setScreen("eventScene");
        return true;
      },
      grantSmithingTraining: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(applyBlacksmithTraining(save).save);
        refreshSaveState();
        return true;
      },
      resetSmithingTraining: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame({
          ...save,
          player: {
            ...save.player,
            smithing: createDefaultSmithingProgression(),
          },
        });
        refreshSaveState();
        return true;
      },
      openSmithingMiniGame: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        const trainedSave = applyBlacksmithTraining(save).save;

        saveGame(startSmithingJob(trainedSave).save);
        refreshSaveState();
        return true;
      },
      completeSmithingMiniGame: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        let nextSave = startSmithingJob(applyBlacksmithTraining(save).save).save;

        for (let index = 0; index < 10; index += 1) {
          nextSave = applySmithingClick(nextSave).save;
        }

        saveGame(nextSave);
        refreshSaveState();
        return true;
      },
      addGold: (amount = 250) => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(addPlayerGold(save, Math.max(1, Math.floor(amount)), "debug"));
        refreshSaveState();
        return true;
      },
      spawnBanditErik: () => forceDebugTravelEvent("travel_bandit_erik"),
      spawnOrcBanditMilka: () => forceDebugTravelEvent("travel_orc_bandit_milka"),
      forceTravelEvent: (eventId = "travel_bandit_erik") => forceDebugTravelEvent(eventId),
      getTravelEventChance: () => TRAVEL_EVENT_CHANCE,
      removeMeleeCombatBeginnerGuide: () => {
        const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
        const save = loadGame();

        if (!isDev || !save) {
          return false;
        }

        saveGame(removeInventoryItemByTemplateId(save, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID));
        refreshSaveState();
        return true;
      },
      restoreCombatStamina: () => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const textCombat = save.player.textCombat ?? createDefaultPlayerTextCombatState(save.player.derivedStats.stamina);

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...textCombat,
              stamina: textCombat.maxStamina,
            },
          },
        });
        refreshSaveState();
        return true;
      },
      grantCombatTechnique: (techniqueId: CombatTechniqueId) => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const textCombat = save.player.textCombat ?? createDefaultPlayerTextCombatState(save.player.derivedStats.stamina);

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...textCombat,
              knownTechniques: Array.from(new Set([...textCombat.knownTechniques, techniqueId])),
            },
          },
        });
        refreshSaveState();
        return true;
      },
      setCombatDistance: (distance: CombatDistance) => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const textCombat = save.player.textCombat ?? createDefaultPlayerTextCombatState(save.player.derivedStats.stamina);

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...textCombat,
              distance,
            },
          },
        });
        refreshSaveState();
        return true;
      },
      setCombatStance: (stance: CombatStance) => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const textCombat = save.player.textCombat ?? createDefaultPlayerTextCombatState(save.player.derivedStats.stamina);

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...textCombat,
              stance,
            },
          },
        });
        refreshSaveState();
        return true;
      },
      applyCombatInjury: (injury: CombatInjury) => {
        const save = loadGame();

        if (!save) {
          return false;
        }

        const textCombat = save.player.textCombat ?? createDefaultPlayerTextCombatState(save.player.derivedStats.stamina);

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...textCombat,
              injuries: [...textCombat.injuries, injury].slice(-12),
            },
          },
        });
        refreshSaveState();
        return true;
      },
      clearCombatInjuries: () => {
        const save = loadGame();

        if (!save?.player.textCombat) {
          return false;
        }

        saveGame({
          ...save,
          player: {
            ...save.player,
            textCombat: {
              ...save.player.textCombat,
              injuries: [],
            },
          },
        });
        refreshSaveState();
        return true;
      },
    };

    return () => {
      debugWindow.__AI_DND_DEBUG__ = previousDebug;
    };
  }, []);

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" />
      <div className="app-shell__content">
        {screen === "mainMenu" ? (
          <MainMenu
            hasSave={hasSave()}
            onNewGame={() => openScreen("characterCreation")}
            onContinue={continueGame}
            onSettings={() => setScreen("settings")}
          />
        ) : null}

        {screen === "characterCreation" ? (
          <CharacterCreation
            onBackToMenu={backToMenu}
            onStartJourney={startIntroScene}
          />
        ) : null}

        {screen === "worldMap" ? (
          <WorldMap
            saveVersion={saveVersion}
            onOpenEvent={() => openScreen("eventScene")}
            onOpenCityMap={() => openScreen("cityMap")}
            onOpenSwampMap={() => openScreen("swampMap")}
            onOpenCamp={() => openScreen("campScene")}
            onOpenInventory={() => openInventory("worldMap")}
            onOpenJournal={() => setScreen("journal")}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "cityMap" ? (
          <CityMapScene
            onOpenEvent={() => openScreen("eventScene")}
            onOpenInventory={() => openInventory("cityMap")}
            onOpenWorldMap={() => {
              refreshSaveState();
              openScreen("worldMap");
            }}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "swampMap" ? (
          <SwampMapScene
            onOpenEvent={() => openScreen("eventScene")}
            onOpenInventory={() => openInventory("swampMap")}
            onOpenWorldMap={() => {
              refreshSaveState();
              openScreen("worldMap");
            }}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "eventScene" ? (
          <EventScene
            onBackToMenu={backToMenu}
            onOpenInventory={(source) => openInventory(source)}
            onOpenJournal={() => setScreen("journal")}
            onOpenSettings={() => setScreen("settings")}
            onOpenCityMap={() => {
              refreshSaveState();
              openScreen("cityMap");
            }}
            onOpenWorldMap={() => {
              refreshSaveState();
              openScreen("worldMap");
            }}
            onOpenSwampMap={() => {
              refreshSaveState();
              openScreen("swampMap");
            }}
          />
        ) : null}
        {screen === "campScene" ? (
          <CampScene
            onOpenInventory={() => openInventory("campScene")}
            onOpenWorldMap={() => {
              refreshSaveState();
              openScreen("worldMap");
            }}
          />
        ) : null}
        {screen === "inventory" ? (
          <Inventory
            onClose={closeInventory}
            onOpenMap={openMapFromInventory}
            onOpenJournal={() => setScreen("journal")}
            onOpenSettings={() => setScreen("settings")}
          />
        ) : null}
        {screen === "journal" ? <Journal onBackToMenu={backToMenu} /> : null}
        {screen === "settings" ? (
          <Settings
            currentLanguage={language}
            onBackToMenu={backToMenu}
            onLanguageChange={changeLanguage}
          />
        ) : null}
      </div>
    </main>
  );
}
