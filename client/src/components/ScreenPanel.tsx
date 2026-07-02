import type { ReactNode } from "react";
import { FantasyButton } from "./FantasyButton";

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
        <p className="screen-panel__eyebrow">AI-DND Prototype</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {children ? <div className="screen-panel__content">{children}</div> : null}

      {onBackToMenu ? (
        <div className="screen-panel__footer">
          <FantasyButton onClick={onBackToMenu}>Back to Menu</FantasyButton>
        </div>
      ) : null}
    </section>
  );
}
