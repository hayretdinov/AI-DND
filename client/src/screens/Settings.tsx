import { ScreenPanel } from "../components/ScreenPanel";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { t } from "../i18n/i18n";
import type { Language } from "../i18n/languages";

type SettingsProps = {
  currentLanguage: Language;
  onBackToMenu: () => void;
  onLanguageChange: (language: Language) => void;
};

export function Settings({ currentLanguage, onBackToMenu, onLanguageChange }: SettingsProps) {
  return (
    <ScreenPanel
      title={t("settingsTitle")}
      subtitle={t("settingsSubtitle")}
      onBackToMenu={onBackToMenu}
    >
      <LanguageSwitch currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
    </ScreenPanel>
  );
}
