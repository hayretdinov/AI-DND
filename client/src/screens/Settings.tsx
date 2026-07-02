import { ScreenPanel } from "../components/ScreenPanel";

type SettingsProps = {
  onBackToMenu: () => void;
};

export function Settings({ onBackToMenu }: SettingsProps) {
  return (
    <ScreenPanel
      title="Settings"
      subtitle="A placeholder for accessibility, text scale, and thought display preferences."
      onBackToMenu={onBackToMenu}
    />
  );
}
