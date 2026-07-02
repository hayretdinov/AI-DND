import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";
import { t, type TranslationKey } from "../i18n/i18n";
import { loadGame } from "../systems/save/saveSystem";
import type { PlayerOrigin } from "../types/player";

type WorldMapProps = {
  saveVersion: number;
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onBackToMenu: () => void;
};

const ORIGIN_LABEL_KEYS: Record<PlayerOrigin, TranslationKey> = {
  prisoner: "originPrisoner",
  deserter: "originDeserter",
  hunter: "originHunter",
  scholar: "originScholar",
  outcast: "originOutcast",
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
      title={t("worldMapTitle")}
      subtitle={t("worldMapSubtitle")}
      onBackToMenu={onBackToMenu}
    >
      {save ? (
        <>
          <div className="world-summary">
            <p>{t("traveler")}</p>
            <h2>{save.player.name}</h2>
            <dl>
              <div>
                <dt>{t("origin")}</dt>
                <dd>{t(ORIGIN_LABEL_KEYS[save.player.origin])}</dd>
              </div>
              <div>
                <dt>{t("health")}</dt>
                <dd>{save.player.derivedStats.health}</dd>
              </div>
              <div>
                <dt>{t("stamina")}</dt>
                <dd>{save.player.derivedStats.stamina}</dd>
              </div>
              <div>
                <dt>{t("armorClass")}</dt>
                <dd>{save.player.derivedStats.armorClass}</dd>
              </div>
            </dl>
          </div>

          <div className="action-row">
            <FantasyButton onClick={onOpenEvent}>{t("openEventScene")}</FantasyButton>
            <FantasyButton onClick={onOpenInventory}>{t("inventoryTitle")}</FantasyButton>
            <FantasyButton onClick={onOpenJournal}>{t("journalTitle")}</FantasyButton>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>{t("noSavedTraveler")}</p>
          <FantasyButton onClick={onBackToMenu}>{t("backToMenu")}</FantasyButton>
        </div>
      )}
    </ScreenPanel>
  );
}
