import { useState } from "react";
import { CharacterCreation } from "./screens/CharacterCreation";
import { EventScene } from "./screens/EventScene";
import { Inventory } from "./screens/Inventory";
import { Journal } from "./screens/Journal";
import { MainMenu } from "./screens/MainMenu";
import { Settings } from "./screens/Settings";
import { WorldMap } from "./screens/WorldMap";
import type { ScreenName } from "./types/navigation";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("mainMenu");

  const backToMenu = () => setScreen("mainMenu");

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" />
      <div className="app-shell__content">
        {screen === "mainMenu" ? (
          <MainMenu
            onNewGame={() => setScreen("characterCreation")}
            onContinue={() => setScreen("worldMap")}
            onSettings={() => setScreen("settings")}
          />
        ) : null}

        {screen === "characterCreation" ? <CharacterCreation onBackToMenu={backToMenu} /> : null}

        {screen === "worldMap" ? (
          <WorldMap
            onOpenEvent={() => setScreen("eventScene")}
            onOpenInventory={() => setScreen("inventory")}
            onOpenJournal={() => setScreen("journal")}
            onBackToMenu={backToMenu}
          />
        ) : null}

        {screen === "eventScene" ? <EventScene onBackToMenu={backToMenu} /> : null}
        {screen === "inventory" ? <Inventory onBackToMenu={backToMenu} /> : null}
        {screen === "journal" ? <Journal onBackToMenu={backToMenu} /> : null}
        {screen === "settings" ? <Settings onBackToMenu={backToMenu} /> : null}
      </div>
    </main>
  );
}
