import { useState } from "react";
import { ANARIEL_INTRO_EVENT } from "../data/events";
import { t, type TranslationKey } from "../i18n/i18n";
import { loadGame, saveGame, type AnarielCompanionState } from "../systems/save/saveSystem";
import type { EventChoiceAction, EventInteractionMode, EventIntroStep } from "../types/eventScene";

type EventSceneProps = {
  onBackToMenu: () => void;
  onOpenWorldMap: () => void;
};

const sidebarItems = [
  { key: "event.ui.sidebarQuest", glyph: "Q" },
  { key: "event.ui.sidebarBag", glyph: "B" },
  { key: "event.ui.sidebarMap", glyph: "M" },
] as const;

function getDialogueKey(action: EventChoiceAction): TranslationKey {
  if (action === "ask_anariel") {
    return "event.anarielIntro.dialogueAsk";
  }

  if (action === "inspect_chains") {
    return "event.anarielIntro.dialogueInspectChains";
  }

  return ANARIEL_INTRO_EVENT.dialogueInitialKey;
}

function getUpdatedAnarielState(
  status: AnarielCompanionState["status"],
  currentState?: AnarielCompanionState,
): AnarielCompanionState {
  return {
    met: true,
    status,
    isTravellingWithPlayer: status === "rescued",
    introEventSeen: true,
    relationship: status === "rescued" ? Math.max(5, currentState?.relationship ?? 5) : currentState?.relationship ?? 0,
  };
}

export function EventScene({ onBackToMenu, onOpenWorldMap }: EventSceneProps) {
  const event = ANARIEL_INTRO_EVENT;
  const [dialogueKey, setDialogueKey] = useState<TranslationKey>(event.dialogueInitialKey);
  const [interactionMode] = useState<EventInteractionMode>(event.interactionMode);
  const [introStep, setIntroStep] = useState<EventIntroStep>("initial");
  const isStandingStep = introStep === "standing";
  const speakerImage = isStandingStep ? event.standingImage : event.speakerImage;
  const choices = isStandingStep ? event.standingChoices : event.choices;

  const finishIntro = (status: AnarielCompanionState["status"]) => {
    const save = loadGame();

    if (save) {
      saveGame({
        ...save,
        companions: {
          ...save.companions,
          anariel: getUpdatedAnarielState(status, save.companions?.anariel),
        },
      });
    }

    onOpenWorldMap();
  };

  const chooseAction = (action: EventChoiceAction) => {
    if (action === "rescue_anariel") {
      setIntroStep("standing");
      setDialogueKey(event.dialogueStandingKey);
      return;
    }

    if (action === "take_anariel" || action === "start_journey_together") {
      finishIntro("rescued");
      return;
    }

    if (action === "ignore_anariel") {
      finishIntro("ignored");
      return;
    }

    setDialogueKey(getDialogueKey(action));
  };

  return (
    <section className={`event-scene event-scene--${introStep}`} aria-labelledby="event-scene-title">
      <img className="event-scene-background" src={event.backgroundImage} alt="" />
      <div className="event-scene-vignette" aria-hidden="true" />

      <header className="event-scene-header">
        <div className="event-scene-header-title">
          <span aria-hidden="true" />
          <h1 id="event-scene-title">{t(event.titleKey)}</h1>
          <span aria-hidden="true" />
        </div>
      </header>

      <aside className="event-scene-location-panel" aria-label={t("event.ui.locationPanel")}>
        <div className="event-scene-location-panel__sigil" aria-hidden="true">✦</div>
        <div>
          <h2>{t(event.locationTitleKey)}</h2>
          <p>{t(event.locationSubtitleKey)}</p>
        </div>
        <time>{event.timeLabel}</time>
        <button className="event-scene-close-button" type="button" onClick={onBackToMenu} aria-label={t("event.ui.close")}>
          ×
        </button>
      </aside>

      <aside className="event-scene-sidebar" aria-label={t("event.ui.sidebar")}>
        {sidebarItems.map((item) => (
          <button className="event-scene-sidebar-button" key={item.key} type="button" disabled>
            <span>{item.glyph}</span>
            <small>{t(item.key)}</small>
          </button>
        ))}
      </aside>

      <div className="event-scene-character" aria-hidden="true">
        <img src={speakerImage} alt="" />
      </div>

      <section className="event-scene-dialogue-panel" aria-label={t("event.ui.dialoguePanel")}>
        <div className="event-scene-speaker-portrait">
          <img src={speakerImage} alt="" />
          <span>{t(event.speakerNameKey).slice(0, 1)}</span>
        </div>
        <div className="event-scene-dialogue-body">
          <h2 className="event-scene-speaker-name">{t(event.speakerNameKey)}</h2>
          <div className="event-scene-dialogue-divider" aria-hidden="true" />
          <p className="event-scene-dialogue-text">{t(dialogueKey)}</p>
          {isStandingStep ? (
            <p className="event-scene-dialogue-text event-scene-dialogue-text--response">
              {t(event.dialogueStandingLineKey)}
            </p>
          ) : null}
          <p className="event-scene-footer-hint">
            <kbd>Space</kbd>
            <span>{t("event.ui.continue")}</span>
          </p>
        </div>
      </section>

      <aside
        className={`event-scene-interaction-panel event-scene-interaction-panel--${interactionMode}`}
        aria-label={t("event.ui.choicePanel")}
      >
        {interactionMode === "choices" ? (
          // TODO: after Anariel becomes an active companion, replace this choice panel with companion dialogue/advice.
          <div className="event-scene-choice-list">
            {choices.map((choice, index) => (
              <button
                className="event-scene-choice-button"
                key={choice.id}
                type="button"
                onClick={() => chooseAction(choice.action)}
              >
                <span className="event-scene-choice-index">{index + 1}</span>
                <span>{t(choice.labelKey)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="event-scene-companion-panel">
            <h2>{t(event.speakerNameKey)}</h2>
            <p>{t("event.ui.companionPanelPlaceholder")}</p>
          </div>
        )}
        <p className="event-scene-footer-hint event-scene-footer-hint--close">
          <kbd>Esc</kbd>
          <span>{t("event.ui.close")}</span>
        </p>
      </aside>
    </section>
  );
}
