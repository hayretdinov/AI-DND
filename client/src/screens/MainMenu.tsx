import { useState } from "react";
import { FantasyButton } from "../components/FantasyButton";
import { t } from "../i18n/i18n";

const MAIN_MENU_LOGO_SRC = "/assets/branding/game_logo.png";

const renderButtonLabel = (label: string) => (
  <span className="main-menu__button-label">
    <span>{label}</span>
  </span>
);

type MainMenuProps = {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
};

export function MainMenu({
  hasSave,
  onNewGame,
  onContinue,
  onSettings,
}: MainMenuProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <section className="main-menu" aria-labelledby="main-menu-title">
      <video
        className="main-menu__video-background"
        autoPlay
        muted
        loop
        playsInline
        poster="/assets/backgrounds/main-menu/main-menu-background.png"
        aria-hidden="true"
      >
        <source src="/assets/videos/main-menu/main-menu-background-loop.mp4" type="video/mp4" />
      </video>

      <h1 id="main-menu-title" className="main-menu__screen-title">
        {t("appTitle")}
      </h1>

      <div className="main-menu__logo">
        {logoFailed ? (
          <span className="main-menu__logo-fallback">AI-DND</span>
        ) : (
          <img
            className="main-menu__logo-image main-menu-logo-image"
            src={MAIN_MENU_LOGO_SRC}
            alt=""
            aria-hidden="true"
            onError={() => setLogoFailed(true)}
          />
        )}
      </div>

      <nav className="main-menu__actions" aria-label={t("mainMenuNavLabel")}>
        <FantasyButton className="main-menu__primary-action" variant="primary" onClick={onNewGame}>
          {renderButtonLabel(t("newGame"))}
        </FantasyButton>
        <div className="main-menu__secondary-actions">
          <FantasyButton onClick={onContinue} disabled={!hasSave}>
            {renderButtonLabel(t("continue"))}
          </FantasyButton>
          <FantasyButton onClick={onSettings}>{renderButtonLabel(t("settings"))}</FantasyButton>
        </div>
      </nav>
    </section>
  );
}
