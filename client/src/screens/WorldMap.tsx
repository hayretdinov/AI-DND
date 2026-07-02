import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";
import { loadGame } from "../systems/save/saveSystem";

type WorldMapProps = {
  saveVersion: number;
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onBackToMenu: () => void;
};

export function WorldMap({
  saveVersion: _saveVersion,
  onOpenEvent,
  onOpenInventory,
  onOpenJournal,
  onBackToMenu,
}: WorldMapProps) {
  const save = loadGame();

  return (
    <ScreenPanel
      title="World Map"
      subtitle="A parchment placeholder for routes, settlements, roads, and unknown dangers."
      onBackToMenu={onBackToMenu}
    >
      {save ? (
        <>
          <div className="world-summary">
            <p>Traveler</p>
            <h2>{save.player.name}</h2>
            <dl>
              <div>
                <dt>Origin</dt>
                <dd>{save.player.origin}</dd>
              </div>
              <div>
                <dt>Health</dt>
                <dd>{save.player.derivedStats.health}</dd>
              </div>
              <div>
                <dt>Stamina</dt>
                <dd>{save.player.derivedStats.stamina}</dd>
              </div>
              <div>
                <dt>Armor Class</dt>
                <dd>{save.player.derivedStats.armorClass}</dd>
              </div>
            </dl>
          </div>

          <div className="action-row">
            <FantasyButton onClick={onOpenEvent}>Open Event Scene</FantasyButton>
            <FantasyButton onClick={onOpenInventory}>Inventory</FantasyButton>
            <FantasyButton onClick={onOpenJournal}>Journal</FantasyButton>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>No saved traveler is known to the valley.</p>
          <FantasyButton onClick={onBackToMenu}>Back to Menu</FantasyButton>
        </div>
      )}
    </ScreenPanel>
  );
}
