import { ScreenPanel } from "../components/ScreenPanel";

type CharacterCreationProps = {
  onBackToMenu: () => void;
};

export function CharacterCreation({ onBackToMenu }: CharacterCreationProps) {
  return (
    <ScreenPanel
      title="Character Creation"
      subtitle="A placeholder for origin, identity, and the first marks of a life in the Ashen Valley."
      onBackToMenu={onBackToMenu}
    />
  );
}
