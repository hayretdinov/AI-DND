import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";

type WorldMapProps = {
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onBackToMenu: () => void;
};

export function WorldMap({
  onOpenEvent,
  onOpenInventory,
  onOpenJournal,
  onBackToMenu,
}: WorldMapProps) {
  return (
    <ScreenPanel
      title="World Map"
      subtitle="A parchment placeholder for routes, settlements, roads, and unknown dangers."
      onBackToMenu={onBackToMenu}
    >
      <div className="action-row">
        <FantasyButton onClick={onOpenEvent}>Open Event Scene</FantasyButton>
        <FantasyButton onClick={onOpenInventory}>Inventory</FantasyButton>
        <FantasyButton onClick={onOpenJournal}>Journal</FantasyButton>
      </div>
    </ScreenPanel>
  );
}
