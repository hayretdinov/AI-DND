import { useState } from "react";
import { ScreenPanel } from "../components/ScreenPanel";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { t } from "../i18n/i18n";
import type { Language } from "../i18n/languages";
import {
  DEFAULT_LOCAL_AI_BASE_URL,
  DEFAULT_LOCAL_AI_MODEL_ID,
  getLocalAiSettings,
  LOCAL_AI_PROXY_ENDPOINT,
  requestLocalChatCompletion,
  saveLocalAiSettings,
} from "../systems/ai/localAiClient";

type SettingsProps = {
  currentLanguage: Language;
  onBackToMenu: () => void;
  onLanguageChange: (language: Language) => void;
};

export function Settings({ currentLanguage, onBackToMenu, onLanguageChange }: SettingsProps) {
  const [localAiSettings, setLocalAiSettings] = useState(() => getLocalAiSettings());
  const [localAiTestMessage, setLocalAiTestMessage] = useState("");
  const [isTestingLocalAi, setIsTestingLocalAi] = useState(false);

  const updateLocalAiSettings = (nextSettings: typeof localAiSettings) => {
    setLocalAiSettings(nextSettings);
    saveLocalAiSettings(nextSettings);
  };

  const testLocalAi = async () => {
    setIsTestingLocalAi(true);
    setLocalAiTestMessage("");
    saveLocalAiSettings(localAiSettings);

    const result = await requestLocalChatCompletion(
      [
        {
          role: "system",
          content: "You are a test assistant.",
        },
        {
          role: "user",
          content: "Ответь одним словом: работает",
        },
      ],
      {
        settings: localAiSettings,
        ignoreEnabled: true,
        temperature: 0.2,
        maxTokens: 30,
      },
    );

    if (result.usedFallback) {
      const model = result.model ?? (localAiSettings.modelId || DEFAULT_LOCAL_AI_MODEL_ID);
      setLocalAiTestMessage(
        `${t("settings.localAi.testFailed")}: endpoint=${
          result.endpoint ?? LOCAL_AI_PROXY_ENDPOINT
        } status=${result.status ?? ""} model=${model} ${result.errorBody ?? ""} ${t(
          "settings.localAi.checkModelId",
        )}`.trim(),
      );
    } else {
      setLocalAiTestMessage(t("settings.localAi.connected"));
    }

    setIsTestingLocalAi(false);
  };

  return (
    <ScreenPanel
      title={t("settingsTitle")}
      subtitle={t("settingsSubtitle")}
      onBackToMenu={onBackToMenu}
    >
      <LanguageSwitch currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
      <section className="settings-local-ai-panel">
        <h2>{t("settings.localAi.title")}</h2>
        <label>
          <input
            type="checkbox"
            checked={localAiSettings.enabled}
            onChange={(event) =>
              updateLocalAiSettings({ ...localAiSettings, enabled: event.target.checked })
            }
          />
          <span>{t("settings.localAi.enabled")}</span>
        </label>
        <label>
          <span>{t("settings.localAi.baseUrl")}</span>
          <input
            value={localAiSettings.baseUrl}
            placeholder={DEFAULT_LOCAL_AI_BASE_URL}
            onChange={(event) =>
              updateLocalAiSettings({ ...localAiSettings, baseUrl: event.target.value })
            }
          />
        </label>
        <label>
          <span>{t("settings.localAi.modelId")}</span>
          <input
            value={localAiSettings.modelId}
            placeholder={DEFAULT_LOCAL_AI_MODEL_ID}
            onChange={(event) =>
              updateLocalAiSettings({ ...localAiSettings, modelId: event.target.value })
            }
          />
        </label>
        <p className="settings-local-ai-hint">{t("settings.localAi.proxyHint")}</p>
        <button
          className="settings-local-ai-test"
          type="button"
          onClick={() => void testLocalAi()}
          disabled={isTestingLocalAi}
        >
          {isTestingLocalAi ? t("companion.chat.thinking") : t("settings.localAi.test")}
        </button>
        {localAiTestMessage ? <p className="settings-local-ai-status">{localAiTestMessage}</p> : null}
      </section>
    </ScreenPanel>
  );
}
