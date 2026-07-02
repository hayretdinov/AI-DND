import { ScreenPanel } from "../components/ScreenPanel";
import { t } from "../i18n/i18n";

type JournalProps = {
  onBackToMenu: () => void;
};

export function Journal({ onBackToMenu }: JournalProps) {
  return (
    <ScreenPanel
      title={t("journalTitle")}
      subtitle={t("journalSubtitle")}
      onBackToMenu={onBackToMenu}
    />
  );
}
