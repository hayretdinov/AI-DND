import { FantasyButton } from "../components/FantasyButton";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { t } from "../i18n/i18n";
import type { Language } from "../i18n/languages";

type MainMenuProps = {
  currentLanguage: Language;
  hasSave: boolean;
  onLanguageChange: (language: Language) => void;
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
};

export function MainMenu({
  currentLanguage,
  hasSave,
  onLanguageChange,
  onNewGame,
  onContinue,
  onSettings,
}: MainMenuProps) {
  return (
    <section className="main-menu" aria-labelledby="main-menu-title">
      <LanguageSwitch
        compact
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />
      <div className="main-menu__mark">{t("mainMenuMark")}</div>
      <h1 id="main-menu-title">{t("appTitle")}</h1>
      <p className="main-menu__subtitle">{t("mainMenuSubtitle")}</p>

      <nav className="main-menu__actions" aria-label={t("mainMenuNavLabel")}>
        <FantasyButton variant="primary" onClick={onNewGame}>
          {t("newGame")}
        </FantasyButton>
        <FantasyButton onClick={onContinue} disabled={!hasSave}>
          {t("continue")}
        </FantasyButton>
        <FantasyButton onClick={onSettings}>{t("settings")}</FantasyButton>
      </nav>
    </section>
  );
}
