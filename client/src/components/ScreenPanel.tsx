import type { ReactNode } from "react";
import { FantasyButton } from "./FantasyButton";
import { t } from "../i18n/i18n";

type ScreenPanelProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
  onBackToMenu?: () => void;
};

export function ScreenPanel({ title, subtitle, children, onBackToMenu }: ScreenPanelProps) {
  return (
    <section className="screen-panel">
      <div className="screen-panel__header">
        <p className="screen-panel__eyebrow">{t("appEyebrow")}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {children ? <div className="screen-panel__content">{children}</div> : null}

      {onBackToMenu ? (
        <div className="screen-panel__footer">
          <FantasyButton onClick={onBackToMenu}>{t("backToMenu")}</FantasyButton>
        </div>
      ) : null}
    </section>
  );
}
