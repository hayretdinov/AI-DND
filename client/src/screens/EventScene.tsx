import { useState } from "react";
import {
  appendDialogueMessages,
  applyAnarielToneDelta,
  analyzePlayerTone,
  getAnarielAiReply,
  getFallbackReplyKey,
} from "../systems/companions/anarielDialogue";
import {
  ANARIEL_ADVICE_PORTRAIT,
  getAnarielGateAdviceKey,
  getAnarielWorldAdviceKey,
  isAnarielActiveCompanion,
} from "../data/companions/anarielAdvice";
import { ANARIEL_INTRO_EVENT } from "../data/events";
import { getLocationEventById } from "../data/locationEvents";
import { getNpcById } from "../data/npcs";
import { getTravelEventById } from "../data/travelEvents";
import { t, type TranslationKey } from "../i18n/i18n";
import {
  loadGame,
  saveGame,
  type AnarielCompanionState,
  type GameSave,
} from "../systems/save/saveSystem";
import {
  appendNpcDialogueMessages,
  applyNpcToneDelta,
  createInitialNpcState,
  getNpcAiReply,
  getNpcFallbackReplyKey,
} from "../systems/npc/npcDialogueSystem";
import type { EventChoiceAction, EventInteractionMode, EventIntroStep } from "../types/eventScene";
import type { LocationEventDefinition, TravelEventDefinition } from "../types/events";
import type { NpcDefinition, NpcRuntimeState } from "../types/npc";

type EventSceneProps = {
  onBackToMenu: () => void;
  onOpenWorldMap: () => void;
};

const sidebarItems = [
  { key: "event.ui.sidebarQuest", glyph: "Q" },
  { key: "event.ui.sidebarBag", glyph: "B" },
  { key: "event.ui.sidebarMap", glyph: "M" },
] as const;

const FALLBACK_NPC_IMAGE = "/assets/npcs/road_bandit.png";

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
  const isRescued = status === "rescued" || status === "companion";

  return {
    met: true,
    status,
    isTravellingWithPlayer: isRescued,
    introEventSeen: true,
    relationship: isRescued ? Math.max(10, currentState?.relationship ?? 10) : currentState?.relationship ?? 0,
    trust: isRescued ? Math.max(15, currentState?.trust ?? 15) : currentState?.trust ?? 0,
    fear: isRescued ? Math.max(35, currentState?.fear ?? 35) : currentState?.fear ?? 0,
    respect: isRescued ? Math.max(5, currentState?.respect ?? 5) : currentState?.respect ?? 0,
    lastDialogueSummary: currentState?.lastDialogueSummary,
    dialogueHistory: currentState?.dialogueHistory ?? [],
  };
}

function getNpcState(save: GameSave | null, npcId: string): NpcRuntimeState {
  return save?.npcs?.[npcId] ?? createInitialNpcState(npcId);
}

function getDynamicEvent(save: GameSave | null) {
  const activeEvent = save?.activeEvent;

  if (!activeEvent || activeEvent.eventId === "anariel_intro") {
    return null;
  }

  return getLocationEventById(activeEvent.eventId) ?? getTravelEventById(activeEvent.eventId) ?? null;
}

function isLocationEvent(event: LocationEventDefinition | TravelEventDefinition): event is LocationEventDefinition {
  return event.type === "gate";
}

function getNpcMoodKey(npc: NpcDefinition): TranslationKey {
  if (npc.role === "guard") {
    return "npc.mood.suspicious";
  }

  if (npc.role === "bandit") {
    return "npc.mood.hostile";
  }

  return "npc.mood.beast";
}

export function EventScene({ onBackToMenu, onOpenWorldMap }: EventSceneProps) {
  const loadedSave = loadGame();
  const dynamicEvent = getDynamicEvent(loadedSave);
  const activeNpc = dynamicEvent ? getNpcById(dynamicEvent.npcId) : null;
  const [dialogueKey, setDialogueKey] = useState<TranslationKey>(
    dynamicEvent?.descriptionKey ?? ANARIEL_INTRO_EVENT.dialogueInitialKey,
  );
  const [interactionMode] = useState<EventInteractionMode>(ANARIEL_INTRO_EVENT.interactionMode);
  const [introStep, setIntroStep] = useState<EventIntroStep>("initial");
  const [companionAdviceIndex, setCompanionAdviceIndex] = useState(0);
  const [isCompanionPortraitMissing, setIsCompanionPortraitMissing] = useState(false);
  const [chatSave, setChatSave] = useState<GameSave | null>(() => loadedSave);
  const [isAnarielChatOpen, setIsAnarielChatOpen] = useState(false);
  const [anarielChatInput, setAnarielChatInput] = useState("");
  const [isAnarielThinking, setIsAnarielThinking] = useState(false);
  const [anarielChatNotice, setAnarielChatNotice] = useState("");
  const [isNpcChatOpen, setIsNpcChatOpen] = useState(false);
  const [npcChatInput, setNpcChatInput] = useState("");
  const [isNpcThinking, setIsNpcThinking] = useState(false);
  const [npcChatNotice, setNpcChatNotice] = useState("");
  const [eventResultKey, setEventResultKey] = useState<TranslationKey | "">("");
  const currentChatSave = chatSave ?? loadedSave;
  const showAnarielCompanionPanel = isAnarielActiveCompanion(currentChatSave);
  const activeAnarielState = currentChatSave?.companions?.anariel;
  const anarielDialogueHistory = activeAnarielState?.dialogueHistory ?? [];
  const isStandingStep = introStep === "standing";
  const introEvent = ANARIEL_INTRO_EVENT;
  const speakerImage = dynamicEvent
    ? activeNpc?.imageUrl ?? FALLBACK_NPC_IMAGE
    : isStandingStep
      ? introEvent.standingImage
      : introEvent.speakerImage;
  const choices = isStandingStep ? introEvent.standingChoices : introEvent.choices;
  const companionAdviceKey =
    dynamicEvent?.type === "bandit"
      ? "companion.anariel.banditAdvice"
      : dynamicEvent?.type === "beast"
        ? "companion.anariel.beastAdvice"
        : companionAdviceIndex === 0
          ? getAnarielGateAdviceKey()
          : getAnarielWorldAdviceKey(companionAdviceIndex - 1);
  const npcState = activeNpc ? getNpcState(currentChatSave, activeNpc.id) : null;
  const npcHistory = npcState?.dialogueHistory ?? [];
  const isRags = (currentChatSave?.player.currentOutfitStage ?? "rags") === "rags";

  const finishIntro = (status: AnarielCompanionState["status"]) => {
    const save = loadGame();

    if (save) {
      saveGame({
        ...save,
        activeEvent: null,
        companions: {
          ...save.companions,
          anariel: getUpdatedAnarielState(status, save.companions?.anariel),
        },
      });
    }

    onOpenWorldMap();
  };

  const returnToWorldMap = () => {
    const save = loadGame();

    if (save) {
      const pendingTravelTargetId = save.activeEvent?.pendingTravelTargetId;
      saveGame({
        ...save,
        activeEvent: null,
        currentLocationId: pendingTravelTargetId ?? save.currentLocationId,
      });
    }

    onOpenWorldMap();
  };

  const chooseAction = (action: EventChoiceAction) => {
    if (action === "rescue_anariel") {
      setIntroStep("standing");
      setDialogueKey(introEvent.dialogueStandingKey);
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

  const handleGateAttempt = () => {
    setEventResultKey(isRags ? "event.gate.deniedRags" : "event.gate.allowedStub");
  };

  const handleTravelChoice = (key: TranslationKey) => {
    setEventResultKey(key);
  };

  const askCompanionAdvice = () => {
    setCompanionAdviceIndex((currentIndex) => currentIndex + 1);
  };

  const handleSendAnarielMessage = async () => {
    const playerText = anarielChatInput.trim();
    const sourceSave = currentChatSave;
    const sourceAnariel = sourceSave?.companions?.anariel;

    if (!playerText || !sourceSave || !sourceAnariel || !showAnarielCompanionPanel || isAnarielThinking) {
      return;
    }

    setIsAnarielThinking(true);
    setAnarielChatInput("");

    const tonedAnariel = applyAnarielToneDelta(sourceAnariel, analyzePlayerTone(playerText));
    const saveForAi: GameSave = {
      ...sourceSave,
      companions: {
        ...sourceSave.companions,
        anariel: tonedAnariel,
      },
    };
    const fallbackReply = t(getFallbackReplyKey(sourceAnariel.dialogueHistory.length));
    const aiReply = await getAnarielAiReply(saveForAi, playerText);
    const finalAnariel = appendDialogueMessages(tonedAnariel, playerText, aiReply.usedFallback ? fallbackReply : aiReply.text);
    const nextSave: GameSave = {
      ...sourceSave,
      companions: {
        ...sourceSave.companions,
        anariel: finalAnariel,
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setAnarielChatNotice(
      aiReply.usedFallback
        ? t(aiReply.reason === "disabled" ? "companion.chat.aiDisabled" : "companion.chat.aiUnavailable")
        : "",
    );
    setIsAnarielThinking(false);
  };

  const handleSendNpcMessage = async () => {
    const playerText = npcChatInput.trim();
    const sourceSave = currentChatSave;

    if (!playerText || !sourceSave || !activeNpc || !npcState || isNpcThinking) {
      return;
    }

    setIsNpcThinking(true);
    setNpcChatInput("");

    const tonedNpc = applyNpcToneDelta(npcState, playerText);
    const fallbackReply = t(getNpcFallbackReplyKey(activeNpc, npcState.dialogueHistory.length) as TranslationKey);
    const aiReply = await getNpcAiReply(sourceSave, activeNpc, tonedNpc, playerText);
    const nextNpcState = appendNpcDialogueMessages(tonedNpc, playerText, aiReply.usedFallback ? fallbackReply : aiReply.text);
    const nextSave: GameSave = {
      ...sourceSave,
      npcs: {
        ...sourceSave.npcs,
        [activeNpc.id]: nextNpcState,
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice(aiReply.usedFallback ? t("npc.chat.aiUnavailable") : "");
    setIsNpcThinking(false);
  };

  if (dynamicEvent && activeNpc) {
    return (
      <section className={`event-scene event-scene--dynamic event-scene--${dynamicEvent.type}`} aria-labelledby="event-scene-title">
        <img className="event-scene-background" src={dynamicEvent.backgroundImage} alt="" />
        <div className="event-scene-vignette" aria-hidden="true" />

        <header className="event-scene-header">
          <div className="event-scene-header-title">
            <span aria-hidden="true" />
            <h1 id="event-scene-title">{t(dynamicEvent.titleKey)}</h1>
            <span aria-hidden="true" />
          </div>
        </header>

        <aside className="event-scene-location-panel" aria-label={t("event.ui.locationPanel")}>
          <div className="event-scene-location-panel__sigil" aria-hidden="true">✦</div>
          <div>
            <h2>{t(dynamicEvent.locationTitleKey)}</h2>
            <p>{t(dynamicEvent.locationSubtitleKey)}</p>
          </div>
          <time>--:--</time>
          <button className="event-scene-close-button" type="button" onClick={returnToWorldMap} aria-label={t("event.ui.close")}>
            x
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

        <div className="event-scene-character event-scene-character--npc" aria-hidden="true">
          <img src={speakerImage} alt="" />
        </div>

        <section className="event-scene-dialogue-panel event-npc-panel" aria-label={t("event.ui.dialoguePanel")}>
          <div className="event-scene-speaker-portrait">
            <img src={activeNpc.portraitUrl ?? speakerImage} alt="" />
            <span>{t(activeNpc.nameKey).slice(0, 1)}</span>
          </div>
          <div className="event-scene-dialogue-body">
            <h2 className="event-scene-speaker-name">{t(activeNpc.nameKey)}</h2>
            <p className="event-npc-role">{t(getNpcMoodKey(activeNpc))}</p>
            <div className="event-scene-dialogue-divider" aria-hidden="true" />
            <p className="event-scene-dialogue-text">{t(dialogueKey)}</p>
            <p className="event-scene-dialogue-text event-scene-dialogue-text--response">
              {eventResultKey ? t(eventResultKey) : t(activeNpc.greetingKey)}
            </p>
          </div>
        </section>

        {showAnarielCompanionPanel ? (
          <aside className="event-companion-advice">
            <strong>{t("companion.anariel.name")}</strong>
            <p>{t(companionAdviceKey as TranslationKey)}</p>
          </aside>
        ) : null}

        <aside className="event-scene-interaction-panel event-random-travel" aria-label={t("event.ui.choicePanel")}>
          <div className="event-scene-choice-list">
            <button className="event-scene-choice-button" type="button" onClick={() => setIsNpcChatOpen(true)}>
              <span className="event-scene-choice-index">1</span>
              <span>{t("npc.chat.talk")}</span>
            </button>
            {isLocationEvent(dynamicEvent) ? (
              <button className="event-scene-choice-button" type="button" onClick={handleGateAttempt}>
                <span className="event-scene-choice-index">2</span>
                <span>{t("event.gate.enterCity")}</span>
              </button>
            ) : dynamicEvent.type === "bandit" ? (
              <>
                <button className="event-scene-choice-button" type="button" onClick={() => handleTravelChoice("event.choice.giveFood.result")}>
                  <span className="event-scene-choice-index">2</span>
                  <span>{t("event.choice.giveFood")}</span>
                </button>
                <button className="event-scene-choice-button" type="button" onClick={() => handleTravelChoice("event.choice.threaten.result")}>
                  <span className="event-scene-choice-index">3</span>
                  <span>{t("event.choice.threaten")}</span>
                </button>
              </>
            ) : (
              <>
                <button className="event-scene-choice-button" type="button" onClick={() => handleTravelChoice("event.choice.freeze.result")}>
                  <span className="event-scene-choice-index">2</span>
                  <span>{t("event.choice.freeze")}</span>
                </button>
                <button className="event-scene-choice-button" type="button" onClick={() => handleTravelChoice("event.choice.throwFood.result")}>
                  <span className="event-scene-choice-index">3</span>
                  <span>{t("event.choice.throwFood")}</span>
                </button>
              </>
            )}
            <button className="event-scene-choice-button" type="button" onClick={returnToWorldMap}>
              <span className="event-scene-choice-index">4</span>
              <span>{t(dynamicEvent.type === "gate" ? "event.travel.returnMap" : "event.travel.continue")}</span>
            </button>
          </div>
        </aside>

        {isNpcChatOpen ? (
          <div className="npc-chat-modal" role="dialog" aria-modal="true" aria-label={t("npc.chat.title")}>
            <button className="companion-chat-backdrop" type="button" onClick={() => setIsNpcChatOpen(false)} aria-label={t("event.ui.close")} />
            <section className="npc-chat-panel">
              <header className="npc-chat-header">
                <div>
                  <h2>{t(activeNpc.nameKey)}</h2>
                  <p>{t(getNpcMoodKey(activeNpc))}</p>
                </div>
                <button type="button" onClick={() => setIsNpcChatOpen(false)} aria-label={t("event.ui.close")}>
                  x
                </button>
              </header>
              <div className="npc-chat-stats">
                <span>{t("companion.relationship.relationship")}: {npcState?.relationship ?? 0}</span>
                <span>{t("companion.relationship.trust")}: {npcState?.trust ?? 0}</span>
                <span>{t("companion.relationship.fear")}: {npcState?.fear ?? 0}</span>
                <span>{t("npc.relationship.hostility")}: {npcState?.hostility ?? 0}</span>
              </div>
              <div className="npc-chat-history" aria-live="polite">
                {npcHistory.length > 0 ? (
                  npcHistory.map((message) => (
                    <div className={`npc-chat-message npc-chat-message--${message.speaker}`} key={message.id}>
                      <strong>{message.speaker === "player" ? currentChatSave?.player.name ?? t("traveler") : t(activeNpc.nameKey)}</strong>
                      <p>{message.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="npc-chat-message npc-chat-message--npc">
                    <strong>{t(activeNpc.nameKey)}</strong>
                    <p>{t(activeNpc.greetingKey)}</p>
                  </div>
                )}
                {isNpcThinking ? <p className="npc-chat-thinking">{t("npc.chat.thinking")}</p> : null}
              </div>
              {npcChatNotice ? <p className="companion-chat-notice">{npcChatNotice}</p> : null}
              <form
                className="npc-chat-input-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendNpcMessage();
                }}
              >
                <textarea
                  className="npc-chat-input"
                  value={npcChatInput}
                  onChange={(event) => setNpcChatInput(event.target.value)}
                  placeholder={t("npc.chat.placeholder")}
                  rows={3}
                  disabled={activeNpc.role === "monster"}
                />
                <button className="npc-chat-send" type="submit" disabled={isNpcThinking || npcChatInput.trim().length === 0 || activeNpc.role === "monster"}>
                  {t("npc.chat.send")}
                </button>
              </form>
            </section>
          </div>
        ) : null}
      </section>
    );
  }

  const event = ANARIEL_INTRO_EVENT;

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
          x
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

      <aside className={`event-scene-interaction-panel event-scene-interaction-panel--${interactionMode}`} aria-label={t("event.ui.choicePanel")}>
        {interactionMode === "choices" ? (
          <div className="event-scene-choice-list">
            {choices.map((choice, index) => (
              <button className="event-scene-choice-button" key={choice.id} type="button" onClick={() => chooseAction(choice.action)}>
                <span className="event-scene-choice-index">{index + 1}</span>
                <span>{t(choice.labelKey)}</span>
              </button>
            ))}
          </div>
        ) : showAnarielCompanionPanel ? (
          <div className="event-scene-companion-panel">
            <div className="event-scene-companion-header">
              <div className="event-scene-companion-portrait" aria-hidden="true">
                {!isCompanionPortraitMissing ? (
                  <img src={ANARIEL_ADVICE_PORTRAIT} alt="" draggable={false} onError={() => setIsCompanionPortraitMissing(true)} />
                ) : null}
                <span>A</span>
              </div>
              <div>
                <h2 className="event-scene-companion-name">{t("companion.anariel.name")}</h2>
                <p>{t("companion.anariel.status")}</p>
              </div>
            </div>
            <p className="event-scene-companion-advice">{t(companionAdviceKey as TranslationKey)}</p>
            <button className="event-scene-companion-button" type="button" onClick={askCompanionAdvice}>
              {t("companion.advice.ask")}
            </button>
            <button className="event-scene-companion-button" type="button" onClick={() => setIsAnarielChatOpen(true)}>
              {t("companion.chat.talk")}
            </button>
            <p className="event-scene-companion-note">{t("companion.advice.title")}</p>
          </div>
        ) : (
          <div className="event-scene-companion-panel">
            <p>{t("companion.advice.noCompanion")}</p>
          </div>
        )}
        <p className="event-scene-footer-hint event-scene-footer-hint--close">
          <kbd>Esc</kbd>
          <span>{t("event.ui.close")}</span>
        </p>
      </aside>

      {isAnarielChatOpen && activeAnarielState ? (
        <div className="companion-chat-modal" role="dialog" aria-modal="true" aria-label={t("companion.chat.title")}>
          <button className="companion-chat-backdrop" type="button" onClick={() => setIsAnarielChatOpen(false)} aria-label={t("event.ui.close")} />
          <section className="companion-chat-panel">
            <header className="companion-chat-header">
              <div>
                <h2>{t("companion.chat.title")}</h2>
                <p>{t("companion.anariel.status")}</p>
              </div>
              <button type="button" onClick={() => setIsAnarielChatOpen(false)} aria-label={t("event.ui.close")}>
                x
              </button>
            </header>
            <div className="companion-chat-history" aria-live="polite">
              {anarielDialogueHistory.length > 0 ? (
                anarielDialogueHistory.map((message) => (
                  <div className={`companion-chat-message companion-chat-message--${message.speaker}`} key={message.id}>
                    <strong>{message.speaker === "player" ? currentChatSave?.player.name ?? t("traveler") : t("companion.anariel.name")}</strong>
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <div className="companion-chat-message companion-chat-message--anariel">
                  <strong>{t("companion.anariel.name")}</strong>
                  <p>{t("companion.chat.empty")}</p>
                </div>
              )}
              {isAnarielThinking ? <p className="companion-chat-thinking">{t("companion.chat.thinking")}</p> : null}
            </div>
            {anarielChatNotice ? <p className="companion-chat-notice">{anarielChatNotice}</p> : null}
            <form
              className="companion-chat-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendAnarielMessage();
              }}
            >
              <textarea
                className="companion-chat-input"
                value={anarielChatInput}
                onChange={(event) => setAnarielChatInput(event.target.value)}
                placeholder={t("companion.chat.placeholder")}
                rows={3}
              />
              <button className="companion-chat-send" type="submit" disabled={isAnarielThinking || anarielChatInput.trim().length === 0}>
                {t("companion.chat.send")}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
