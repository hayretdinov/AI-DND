import { LANGUAGES, type Language } from "../i18n/languages";
import { t } from "../i18n/i18n";

type LanguageSwitchProps = {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  compact?: boolean;
};

export function LanguageSwitch({
  currentLanguage,
  onLanguageChange,
  compact = false,
}: LanguageSwitchProps) {
  return (
    <div className={`language-switch ${compact ? "language-switch--compact" : ""}`}>
      {!compact ? <span>{t("language")}</span> : null}
      <div className="language-switch__options" role="group" aria-label={t("language")}>
        {LANGUAGES.map((language) => (
          <button
            className={`language-switch__option ${
              currentLanguage === language.code ? "language-switch__option--active" : ""
            }`}
            type="button"
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
          >
            {language.code === "ru" ? t("russian") : t("english")}
          </button>
        ))}
      </div>
    </div>
  );
}
