import { ScreenPanel } from "../components/ScreenPanel";

type EventSceneProps = {
  onBackToMenu: () => void;
};

export function EventScene({ onBackToMenu }: EventSceneProps) {
  return (
    <ScreenPanel
      title="Event Scene"
      subtitle="A placeholder for narration, NPC speech, thoughts, and free text input."
      onBackToMenu={onBackToMenu}
    />
  );
}
