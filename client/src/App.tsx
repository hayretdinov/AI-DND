import { useEffect, useState } from "react";
import { CharacterCreation } from "./screens/CharacterCreation";
import { CampScene } from "./screens/CampScene";
import { CityMapScene } from "./screens/CityMapScene";
import { EventScene } from "./screens/EventScene";
import { Inventory } from "./screens/Inventory";
import { Journal } from "./screens/Journal";
import { MainMenu } from "./screens/MainMenu";
import { Settings } from "./screens/Settings";
import { WorldMap } from "./screens/WorldMap";
import { createInitialAnarielCompanionState, hasSave, loadGame, saveGame } from "./systems/save/saveSystem";
import { getRoyalCourtEventId, getRoyalCourtNpcById } from "./data/royalCourtNpcs";
import { getLanguage, setLanguage } from "./i18n/i18n";
import type { Language } from "./i18n/languages";
import type { ScreenName } from "./types/navigation";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("mainMenu");
  const [saveVersion, setSaveVersion] = useState(0);
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  const backToMenu = () => setScreen("mainMenu");
  const refreshSaveState = () => setSaveVersion((version) => version + 1);
  const continueGame = () => {
    setScreen("worldMap");
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
    setScreen("eventScene");
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
      };
    };
    const previousDebug = debugWindow.__AI_DND_DEBUG__;

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
            onNewGame={() => setScreen("characterCreation")}
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
            onOpenEvent={() => setScreen("eventScene")}
            onOpenCityMap={() => setScreen("cityMap")}
            onOpenCamp={() => setScreen("campScene")}
            onOpenInventory={() => setScreen("inventory")}
            onOpenJournal={() => setScreen("journal")}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "cityMap" ? (
          <CityMapScene
            onOpenEvent={() => setScreen("eventScene")}
            onOpenInventory={() => setScreen("inventory")}
            onOpenWorldMap={() => {
              refreshSaveState();
              setScreen("worldMap");
            }}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "eventScene" ? (
          <EventScene
            onBackToMenu={backToMenu}
            onOpenCityMap={() => {
              refreshSaveState();
              setScreen("cityMap");
            }}
            onOpenWorldMap={() => {
              refreshSaveState();
              setScreen("worldMap");
            }}
          />
        ) : null}
        {screen === "campScene" ? (
          <CampScene
            onOpenWorldMap={() => {
              refreshSaveState();
              setScreen("worldMap");
            }}
          />
        ) : null}
        {screen === "inventory" ? (
          <Inventory onBackToMenu={backToMenu} onOpenMap={() => setScreen("worldMap")} />
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
