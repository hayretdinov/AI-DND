import { useState } from "react";
import { CharacterCreation } from "./screens/CharacterCreation";
import { EventScene } from "./screens/EventScene";
import { Inventory } from "./screens/Inventory";
import { Journal } from "./screens/Journal";
import { MainMenu } from "./screens/MainMenu";
import { Settings } from "./screens/Settings";
import { WorldMap } from "./screens/WorldMap";
import { hasSave } from "./systems/save/saveSystem";
import { getLanguage, setLanguage } from "./i18n/i18n";
import type { Language } from "./i18n/languages";
import type { ScreenName } from "./types/navigation";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("mainMenu");
  const [saveVersion, setSaveVersion] = useState(0);
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  const backToMenu = () => setScreen("mainMenu");
  const refreshSaveState = () => setSaveVersion((version) => version + 1);
  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  };

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" />
      <div className="app-shell__content">
        {screen === "mainMenu" ? (
          <MainMenu
            hasSave={hasSave()}
            onNewGame={() => setScreen("characterCreation")}
            onContinue={() => setScreen("worldMap")}
            onSettings={() => setScreen("settings")}
          />
        ) : null}

        {screen === "characterCreation" ? (
          <CharacterCreation
            onBackToMenu={backToMenu}
            onStartJourney={() => {
              refreshSaveState();
              setScreen("worldMap");
            }}
          />
        ) : null}

        {screen === "worldMap" ? (
          <WorldMap
            saveVersion={saveVersion}
            onOpenEvent={() => setScreen("eventScene")}
            onOpenInventory={() => setScreen("inventory")}
            onOpenJournal={() => setScreen("journal")}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "eventScene" ? <EventScene onBackToMenu={backToMenu} /> : null}
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
