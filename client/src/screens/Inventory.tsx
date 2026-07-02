import { ScreenPanel } from "../components/ScreenPanel";

type InventoryProps = {
  onBackToMenu: () => void;
};

export function Inventory({ onBackToMenu }: InventoryProps) {
  return (
    <ScreenPanel
      title="Inventory"
      subtitle="A placeholder for physical possessions, equipment, condition, weight, and ownership."
      onBackToMenu={onBackToMenu}
    />
  );
}
