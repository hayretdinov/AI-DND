import { useRef, useState } from "react";
import { SceneDialoguePanel, type SceneDialogueMessage } from "../components/SceneDialoguePanel";
import { getAnarielImageForCurrentState, isAnarielActiveCompanion } from "../data/companions/anarielVisuals";
import { getLanguage, t } from "../i18n/i18n";
import {
  appendDialogueMessages,
  applyAnarielToneDelta,
  analyzePlayerTone,
  getAnarielAiReply,
  getFallbackReplyKey,
} from "../systems/companions/anarielDialogue";
import { sanitizeAiResponseForWorld } from "../systems/ai/inWorldResponseSanitizer";
import {
  applyCampRestHealthRecovery,
  CAMP_REST_HOURS,
  getCampRestHealthRecovery,
  hasActiveBleeding,
  isActiveCombat,
} from "../systems/resources/resourceRegeneration";
import { loadGame, saveGame, type GameSave } from "../systems/save/saveSystem";

type CampSceneProps = {
  onOpenWorldMap: () => void;
  onOpenInventory: () => void;
};

const CAMP_BACKGROUND = "/assets/locations/player_camp.png";
const DEFAULT_TRAVEL_ENERGY_MAX = 100;
const DEFAULT_DAY = 1;
const DEFAULT_HOUR = 6;

function advanceWorldTime(day: number, hour: number, addedHours: number) {
  const totalHours = hour + addedHours;

  return {
    day: day + Math.floor(totalHours / 24),
    hour: totalHours % 24,
  };
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function CampScene({ onOpenWorldMap, onOpenInventory }: CampSceneProps) {
  const loadedSave = loadGame();
  const [currentSave, setCurrentSave] = useState<GameSave | null>(loadedSave);
  const [campMessage, setCampMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [chatNotice, setChatNotice] = useState("");
  const isRestingRef = useRef(false);
  const save = currentSave;
  const hasAnariel = isAnarielActiveCompanion(save);
  const anarielState = save?.companions?.anariel;
  const anarielImage = getAnarielImageForCurrentState(save);
  const dialogueHistory = anarielState?.dialogueHistory ?? [];
  const sceneDialogueMessages: SceneDialogueMessage[] = dialogueHistory.map((message) => ({
    id: message.id,
    speaker: message.speaker === "player" ? "player" : "npc",
    text: message.text,
    speakerName: message.speaker === "player" ? save?.player.name ?? t("traveler") : t("companion.anariel.name"),
  }));
  const currentEnergy = save?.travelEnergy?.currentEnergy ?? save?.travelEnergy?.maxEnergy ?? DEFAULT_TRAVEL_ENERGY_MAX;
  const maxEnergy = save?.travelEnergy?.maxEnergy ?? DEFAULT_TRAVEL_ENERGY_MAX;
  const energyPercent = Math.min(100, Math.max(0, (currentEnergy / maxEnergy) * 100));
  const currentDay = save?.currentDay ?? DEFAULT_DAY;
  const currentHour = save?.currentHour ?? DEFAULT_HOUR;
  const healthRecovery = save ? getCampRestHealthRecovery(save) : null;
  const healthPercent = healthRecovery?.maxHealth
    ? Math.min(100, Math.max(0, (healthRecovery.currentHealth / healthRecovery.maxHealth) * 100))
    : 0;
  const restBlockedReason = !save
    ? t("camp.restUnavailable")
    : isResting
      ? t("camp.alreadyResting")
      : isActiveCombat(save)
        ? t("camp.cannotRestInCombat")
        : healthRecovery && healthRecovery.currentHealth <= 0
          ? t("camp.cannotRestWhenDefeated")
          : hasActiveBleeding(save)
            ? t("camp.cannotRestWhileBleeding")
            : "";

  const handleRestUntilDawn = () => {
    const sourceSave = loadGame() ?? save;

    if (
      !sourceSave
      || isRestingRef.current
      || isActiveCombat(sourceSave)
      || (sourceSave.player.combat?.currentHealth ?? 0) <= 0
      || hasActiveBleeding(sourceSave)
    ) {
      return;
    }

    isRestingRef.current = true;
    setIsResting(true);
    const nextMaxEnergy = sourceSave.travelEnergy?.maxEnergy ?? DEFAULT_TRAVEL_ENERGY_MAX;
    const nextTime = advanceWorldTime(
      sourceSave.currentDay ?? DEFAULT_DAY,
      sourceSave.currentHour ?? DEFAULT_HOUR,
      CAMP_REST_HOURS,
    );
    const timedSave: GameSave = {
      ...sourceSave,
      currentDay: nextTime.day,
      currentHour: nextTime.hour,
      travelEnergy: {
        currentEnergy: nextMaxEnergy,
        maxEnergy: nextMaxEnergy,
        lastRestDay: nextTime.day,
      },
    };
    const nextSave = applyCampRestHealthRecovery(timedSave);
    const result = getCampRestHealthRecovery(sourceSave);

    saveGame(nextSave, { mode: "sleep", skipHealthRecovery: true });
    setCurrentSave(loadGame() ?? nextSave);
    setCampMessage(
      `${t("camp.restRecovered")} +${result.recovery} ${t("camp.healthPointsShort")} (${result.nextHealth}/${result.maxHealth}).`,
    );
    window.setTimeout(() => {
      isRestingRef.current = false;
      setIsResting(false);
    }, 600);
  };

  const handleSendAnarielMessage = async () => {
    const playerText = chatInput.trim();
    const sourceSave = currentSave;
    const sourceAnariel = sourceSave?.companions?.anariel;

    if (!playerText || !sourceSave || !sourceAnariel || !hasAnariel || isThinking) {
      return;
    }

    setIsThinking(true);
    setChatInput("");

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
    const sanitizedReply = sanitizeAiResponseForWorld({
      text: aiReply.usedFallback ? fallbackReply : aiReply.text,
      speakerId: "anariel",
      speakerRole: "companion",
      language: getLanguage(),
      context: "camp",
    });
    const finalAnariel = appendDialogueMessages(tonedAnariel, playerText, sanitizedReply.cleanText);
    const nextSave: GameSave = {
      ...sourceSave,
      companions: {
        ...sourceSave.companions,
        anariel: finalAnariel,
      },
    };

    saveGame(nextSave);
    setCurrentSave(nextSave);
    setChatNotice(aiReply.usedFallback && aiReply.reason === "disabled" ? t("companion.chat.aiDisabled") : "");
    setIsThinking(false);
  };

  return (
    <section className="camp-scene" aria-labelledby="camp-scene-title">
      <img className="camp-scene-background" src={CAMP_BACKGROUND} alt="" />
      <div className="camp-scene-vignette" aria-hidden="true" />

      <header className="camp-scene-header">
        <div>
          <p>{t("camp.subtitle")}</p>
          <h1 id="camp-scene-title">{t("camp.title")}</h1>
        </div>
        <div className="camp-scene-time" aria-label={t("camp.timePassed")}>
          <span>{t("worldMapDay")} {currentDay}</span>
          <strong>{formatHour(currentHour)}</strong>
        </div>
      </header>

      <main className="camp-scene-panel">
        {hasAnariel ? (
          <div className="camp-scene-character" aria-hidden="true">
            <img src={anarielImage} alt="" draggable={false} />
            <span>{t("companion.anariel.name")}</span>
          </div>
        ) : null}

        <section className="camp-scene-dialogue camp-scene-bottom-dialogue">
          {hasAnariel ? (
            <SceneDialoguePanel
              title={t("camp.talkInline")}
              speakerName={t("companion.anariel.name")}
              speakerRole={t("sceneDialogue.companion")}
              speakerPortraitUrl={anarielImage}
              messages={sceneDialogueMessages}
              emptyText={t("camp.anarielPresent")}
              value={chatInput}
              onChange={setChatInput}
              onSend={() => {
                void handleSendAnarielMessage();
              }}
              isThinking={isThinking}
              notice={chatNotice || campMessage}
              disabled={!hasAnariel}
              stats={[
                { label: t("companion.relationship.relationship"), value: anarielState?.relationship ?? 0 },
                { label: t("companion.relationship.trust"), value: anarielState?.trust ?? 0 },
                { label: t("companion.relationship.fear"), value: anarielState?.fear ?? 0 },
                { label: t("companion.relationship.respect"), value: anarielState?.respect ?? 0 },
              ]}
            />
          ) : (
            <div className="camp-scene-empty-state">
              <p>{t("sceneDialogue.emptyCamp")}</p>
              {campMessage ? <p className="camp-scene-rest-message">{campMessage}</p> : null}
            </div>
          )}
        </section>

        <aside className="camp-scene-energy" aria-label={t("camp.energy")}>
          <div>
            <span>{t("camp.energy")}</span>
            <strong>
              {currentEnergy} / {maxEnergy}
            </strong>
          </div>
          <div className="camp-scene-energy-bar" aria-hidden="true">
            <span style={{ width: `${energyPercent}%` }} />
          </div>
          {healthRecovery ? (
            <div className="camp-scene-health-summary">
              <div>
                <span>{t("camp.health")}</span>
                <strong>{healthRecovery.currentHealth} / {healthRecovery.maxHealth}</strong>
              </div>
              <div className="camp-scene-health-bar" aria-hidden="true">
                <span style={{ width: `${healthPercent}%` }} />
              </div>
              <dl>
                <div><dt>{t("camp.afterRest")}</dt><dd>{healthRecovery.nextHealth} / {healthRecovery.maxHealth}</dd></div>
                <div><dt>{t("camp.expectedRecovery")}</dt><dd>+{healthRecovery.recovery} {t("camp.healthPointsShort")}</dd></div>
                <div><dt>{t("camp.restDuration")}</dt><dd>{CAMP_REST_HOURS} {t("camp.hoursShort")}</dd></div>
              </dl>
              {restBlockedReason ? <p className="camp-scene-rest-blocked">{restBlockedReason}</p> : null}
            </div>
          ) : null}
        </aside>

        <nav className="camp-scene-actions" aria-label={t("event.ui.choicePanel")}>
          {hasAnariel ? <span className="camp-scene-actions-label">{t("camp.talkInline")}</span> : null}
          <button type="button" onClick={handleRestUntilDawn} disabled={Boolean(restBlockedReason)} title={restBlockedReason || undefined}>
            {isResting ? t("camp.resting") : t("camp.restEightHours")}
          </button>
          <button type="button" onClick={onOpenInventory}>
            {t("inventoryTitle")}
          </button>
          <button type="button" onClick={onOpenWorldMap}>
            {t("camp.returnToMap")}
          </button>
        </nav>
      </main>
    </section>
  );
}
