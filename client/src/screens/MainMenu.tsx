import { FantasyButton } from "../components/FantasyButton";

type MainMenuProps = {
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
};

export function MainMenu({ onNewGame, onContinue, onSettings }: MainMenuProps) {
  return (
    <section className="main-menu" aria-labelledby="main-menu-title">
      <div className="main-menu__mark">Ashen Valley</div>
      <h1 id="main-menu-title">AI-DND</h1>
      <p className="main-menu__subtitle">A living dark fantasy RPG prototype</p>

      <nav className="main-menu__actions" aria-label="Main menu">
        <FantasyButton variant="primary" onClick={onNewGame}>
          New Game
        </FantasyButton>
        <FantasyButton onClick={onContinue}>Continue</FantasyButton>
        <FantasyButton onClick={onSettings}>Settings</FantasyButton>
      </nav>
    </section>
  );
}
