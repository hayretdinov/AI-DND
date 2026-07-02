import { ScreenPanel } from "../components/ScreenPanel";

type JournalProps = {
  onBackToMenu: () => void;
};

export function Journal({ onBackToMenu }: JournalProps) {
  return (
    <ScreenPanel
      title="Journal"
      subtitle="A placeholder for observations, memories, rumors, promises, and consequences."
      onBackToMenu={onBackToMenu}
    />
  );
}
