import { ScreenPanel } from "../components/ScreenPanel";
import { t } from "../i18n/i18n";

type InventoryProps = {
  onBackToMenu: () => void;
};

export function Inventory({ onBackToMenu }: InventoryProps) {
  return (
    <ScreenPanel
      title={t("inventoryTitle")}
      subtitle={t("inventorySubtitle")}
      onBackToMenu={onBackToMenu}
    />
  );
}
