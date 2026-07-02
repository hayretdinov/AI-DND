import { ScreenPanel } from "../components/ScreenPanel";
import { t } from "../i18n/i18n";

type EventSceneProps = {
  onBackToMenu: () => void;
};

export function EventScene({ onBackToMenu }: EventSceneProps) {
  return (
    <ScreenPanel
      title={t("eventSceneTitle")}
      subtitle={t("eventSceneSubtitle")}
      onBackToMenu={onBackToMenu}
    />
  );
}
