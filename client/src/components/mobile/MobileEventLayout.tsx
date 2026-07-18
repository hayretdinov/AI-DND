import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { isBlankDialogueMessage, shouldSubmitDialogueKey } from "../dialogueInputUtils";
import type { SceneDialogueMessage } from "../SceneDialoguePanel";
import "./mobile-event.css";

export type MobileQuickReply = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

export type MobileNpcStat = {
  label: string;
  value: string | number;
};

type MobileEventLabels = {
  dialogue: string;
  inventory: string;
  map: string;
  journal: string;
  menu: string;
  npcInfo: string;
  dialogueHistory: string;
  moreReplies: string;
  hideReplies: string;
  showReplies: string;
  writeMessage: string;
  sendMessage: string;
  close: string;
  relationship: string;
  role: string;
  about: string;
  relationshipHistory: string;
  activeEffects: string;
  backendWaiting: string;
  you: string;
  day: string;
  hour: string;
  gold: string;
  weight: string;
};

type MobileEventLayoutProps = {
  labels: MobileEventLabels;
  backgroundUrl: string;
  portraitUrl?: string;
  npcName: string;
  npcRole: string;
  relationship?: number;
  npcDescription?: string;
  relationshipSummary?: string;
  npcStats?: MobileNpcStat[];
  messages: SceneDialogueMessage[];
  latestReply: string;
  quickReplies: MobileQuickReply[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  isThinking: boolean;
  notice?: string;
  disabled?: boolean;
  readOnly?: boolean;
  day: number;
  hour: number;
  gold: number;
  weight: string;
  maxWeight: string;
  statusContent?: ReactNode;
  actionContent?: ReactNode;
  sceneContent?: ReactNode;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenJournal: () => void;
  onOpenMenu: () => void;
};

function setViewportVariables(height: number, offsetTop: number) {
  document.documentElement.style.setProperty("--mobile-event-height", `${Math.round(height)}px`);
  document.documentElement.style.setProperty("--mobile-event-offset-top", `${Math.round(offsetTop)}px`);
}

export function MobileEventLayout({
  labels,
  backgroundUrl,
  portraitUrl,
  npcName,
  npcRole,
  relationship,
  npcDescription,
  relationshipSummary,
  npcStats = [],
  messages,
  latestReply,
  quickReplies,
  value,
  onChange,
  onSend,
  isThinking,
  notice,
  disabled = false,
  readOnly = false,
  day,
  hour,
  gold,
  weight,
  maxWeight,
  statusContent,
  actionContent,
  sceneContent,
  onOpenInventory,
  onOpenMap,
  onOpenJournal,
  onOpenMenu,
}: MobileEventLayoutProps) {
  const [openSheet, setOpenSheet] = useState<"info" | "history" | null>(null);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const baselineHeightRef = useRef(0);
  const viewportWidthRef = useRef(0);

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const viewport = window.visualViewport;

    document.body.style.overflow = "hidden";

    const updateViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      const offsetTop = viewport?.offsetTop ?? 0;
      const inputFocused = document.activeElement === inputRef.current;

      if (!inputFocused || Math.abs(width - viewportWidthRef.current) > 40) {
        baselineHeightRef.current = height;
        viewportWidthRef.current = width;
      } else {
        baselineHeightRef.current = Math.max(baselineHeightRef.current, height);
      }

      setViewportVariables(height, offsetTop);
      setIsKeyboardOpen(inputFocused && baselineHeightRef.current - height > 140);
    };

    baselineHeightRef.current = viewport?.height ?? window.innerHeight;
    viewportWidthRef.current = viewport?.width ?? window.innerWidth;
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      document.body.style.overflow = bodyOverflow;
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      document.documentElement.style.removeProperty("--mobile-event-height");
      document.documentElement.style.removeProperty("--mobile-event-offset-top");
    };
  }, []);

  useEffect(() => {
    if (openSheet !== "history") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const element = historyRef.current;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, openSheet]);

  useEffect(() => {
    if (!openSheet) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenSheet(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openSheet]);

  const submitMessage = async () => {
    if (disabled || readOnly || isThinking || isSubmitting || isBlankDialogueMessage(value)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend();
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!shouldSubmitDialogueKey(event.key, event.shiftKey, event.nativeEvent.isComposing)) {
      return;
    }

    event.preventDefault();
    void submitMessage();
  };

  const visibleReplies = showAllReplies ? quickReplies : quickReplies.slice(0, 4);
  const canSend = !disabled && !readOnly && !isThinking && !isSubmitting && !isBlankDialogueMessage(value);

  return (
    <section className={`mobile-event-scene${isKeyboardOpen ? " mobile-event-scene--keyboard" : ""}`}>
      <img className="mobile-event-scene__background" src={backgroundUrl} alt="" />
      <div className="mobile-event-scene__shade" aria-hidden="true" />

      <header className="mobile-event-hud">
        <button className="mobile-icon-button" type="button" onClick={onOpenMenu} aria-label={labels.menu}>
          <span aria-hidden="true">☰</span>
        </button>
        <div className="mobile-event-hud__facts">
          <span>{labels.day} {day}</span>
          <span>{labels.hour} {String(hour).padStart(2, "0")}:00</span>
          <span aria-label={labels.gold}>◉ {gold}</span>
          <span aria-label={labels.weight}>▣ {weight}/{maxWeight}</span>
        </div>
      </header>

      <main className="mobile-event-scroll">
        <div className="mobile-npc-visual" aria-hidden="true">
          {portraitUrl ? <img src={portraitUrl} alt="" draggable={false} /> : null}
        </div>

        <section className="mobile-npc-dialogue">
          <header className="mobile-npc-header">
            <div className="mobile-npc-header__identity">
              <strong>{npcName}</strong>
              {relationship !== undefined ? <span aria-label={labels.relationship}>♥ {relationship}</span> : null}
            </div>
            <div className="mobile-npc-header__actions">
              <button type="button" onClick={() => setOpenSheet("history")} aria-label={labels.dialogueHistory}>
                <span aria-hidden="true">◷</span>
              </button>
              <button type="button" onClick={() => setOpenSheet("info")} aria-label={labels.npcInfo}>
                <span aria-hidden="true">i</span>
              </button>
            </div>
          </header>

          <div className="mobile-dialogue-card" role="status" aria-live="polite">
            <p>{latestReply}</p>
            {isThinking ? <span className="mobile-dialogue-waiting">{labels.backendWaiting}</span> : null}
            {notice ? <span className="mobile-dialogue-notice">{notice}</span> : null}
          </div>

          {statusContent ? <div className="mobile-event-status">{statusContent}</div> : null}
          {sceneContent ? <div className="mobile-event-scene-content">{sceneContent}</div> : null}

          {!isKeyboardOpen || showAllReplies ? (
            <div className="mobile-quick-replies" aria-label={labels.dialogue}>
              {visibleReplies.map((reply) => (
                <button type="button" key={reply.id} disabled={reply.disabled} onClick={() => void reply.onSelect()}>
                  <span aria-hidden="true">{reply.icon ?? "●"}</span>
                  <span>{reply.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
              {quickReplies.length > 4 ? (
                <button type="button" onClick={() => setShowAllReplies((current) => !current)}>
                  <span aria-hidden="true">⋯</span>
                  <span>{showAllReplies ? labels.hideReplies : labels.moreReplies}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
            </div>
          ) : (
            <button className="mobile-show-replies" type="button" onClick={() => setShowAllReplies(true)}>
              {labels.showReplies}
            </button>
          )}

          {actionContent ? <div className="mobile-event-actions">{actionContent}</div> : null}
        </section>
      </main>

      {!readOnly ? (
        <form
          className="mobile-message-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage();
          }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            placeholder={labels.writeMessage}
            aria-label={labels.writeMessage}
            disabled={disabled || isThinking || isSubmitting}
          />
          <button type="submit" disabled={!canSend} aria-label={labels.sendMessage}>
            <span aria-hidden="true">➤</span>
          </button>
        </form>
      ) : null}

      <nav className="mobile-bottom-navigation" aria-label={labels.menu}>
        <button className="mobile-bottom-navigation__active" type="button" aria-current="page">
          <span aria-hidden="true">●</span><span>{labels.dialogue}</span>
        </button>
        <button type="button" onClick={onOpenInventory}>
          <span aria-hidden="true">▣</span><span>{labels.inventory}</span>
        </button>
        <button type="button" onClick={onOpenMap}>
          <span aria-hidden="true">✦</span><span>{labels.map}</span>
        </button>
        <button type="button" onClick={onOpenJournal}>
          <span aria-hidden="true">▤</span><span>{labels.journal}</span>
        </button>
        <button type="button" onClick={onOpenMenu}>
          <span aria-hidden="true">☰</span><span>{labels.menu}</span>
        </button>
      </nav>

      {openSheet ? (
        <div className="mobile-sheet-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setOpenSheet(null);
          }
        }}>
          <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label={openSheet === "info" ? labels.npcInfo : labels.dialogueHistory}>
            <header className="mobile-sheet__header">
              <h2>{openSheet === "info" ? npcName : labels.dialogueHistory}</h2>
              <button type="button" onClick={() => setOpenSheet(null)} aria-label={labels.close}>×</button>
            </header>

            {openSheet === "info" ? (
              <div className="mobile-sheet__scroll mobile-npc-info">
                <dl>
                  <div><dt>{labels.role}</dt><dd>{npcRole}</dd></div>
                  {relationship !== undefined ? <div><dt>{labels.relationship}</dt><dd>♥ {relationship}</dd></div> : null}
                  {npcStats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
                </dl>
                {relationship !== undefined ? <meter min={-100} max={100} value={relationship}>{relationship}</meter> : null}
                {npcDescription ? <section><h3>{labels.about}</h3><p>{npcDescription}</p></section> : null}
                {relationshipSummary ? <section><h3>{labels.relationshipHistory}</h3><p>{relationshipSummary}</p></section> : null}
              </div>
            ) : (
              <div className="mobile-sheet__scroll mobile-dialogue-history" ref={historyRef} role="log">
                {messages.map((message) => (
                  <article className={`mobile-history-message mobile-history-message--${message.speaker}`} key={message.id}>
                    <div className="mobile-history-avatar" aria-hidden="true">
                      {message.speaker === "player" ? labels.you.slice(0, 1) : portraitUrl ? <img src={portraitUrl} alt="" /> : npcName.slice(0, 1)}
                    </div>
                    <div><strong>{message.speaker === "player" ? labels.you : message.speakerName}</strong><p>{message.text}</p></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
