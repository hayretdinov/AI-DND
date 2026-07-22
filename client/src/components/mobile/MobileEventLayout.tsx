import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { isBlankDialogueMessage, shouldSubmitDialogueKey } from "../dialogueInputUtils";
import type { SceneDialogueMessage } from "../SceneDialoguePanel";
import { MobileBottomNavigation, type MobileNavigationSection } from "./MobileBottomNavigation";
import "./mobile-event.css";

export type MobileQuickReply = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

export type MobileQuickAction = {
  id: "trade" | "gift" | "attack" | "leave";
  label: string;
  icon: string;
  disabled?: boolean;
  onSelect: () => void;
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
  suggestions: string;
  events: string;
  noEvents: string;
  voiceUnavailable: string;
};

type MobileEventLayoutProps = {
  scopeKey?: string;
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
  quickActions?: MobileQuickAction[];
  eventEntries?: string[];
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
  onNavigate?: (section: MobileNavigationSection) => void;
  onOpenMenu: () => void;
};

function setViewportVariables(height: number, offsetTop: number) {
  document.documentElement.style.setProperty("--mobile-event-height", `${Math.round(height)}px`);
  document.documentElement.style.setProperty("--mobile-event-offset-top", `${Math.round(offsetTop)}px`);
}

export function MobileEventLayout({
  scopeKey,
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
  quickActions = [],
  eventEntries = [],
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
  onNavigate,
  onOpenMenu,
}: MobileEventLayoutProps) {
  const [openSheet, setOpenSheet] = useState<"info" | "history" | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const baselineHeightRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const temporaryUiScope = `${scopeKey ?? npcName}:${quickReplies.map((reply) => reply.id).join("|")}`;

  useEffect(() => {
    setOpenSheet(null);
    setShowSuggestions(false);
    setShowEvents(false);
    setIsSubmitting(false);
  }, [temporaryUiScope]);

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
    const frame = window.requestAnimationFrame(() => {
      const element = openSheet === "history" ? historyRef.current : chatRef.current;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isThinking, latestReply, messages.length, openSheet]);

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

  const canSend = !disabled && !readOnly && !isThinking && !isSubmitting && !isBlankDialogueMessage(value);

  const submitMessage = async () => {
    if (!canSend) {
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

  const selectSuggestion = async (reply: MobileQuickReply) => {
    await reply.onSelect();
    setShowSuggestions(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const getMessageTime = (message: SceneDialogueMessage) => {
    if (message.createdAt !== undefined) {
      const date = new Date(message.createdAt);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }

    return `${String(hour).padStart(2, "0")}:00`;
  };

  const renderHistoryMessages = (historyMode = false) => (
    messages.length > 0 ? messages.map((message) => (
      <article className={historyMode ? `mobile-history-message mobile-history-message--${message.speaker}` : `mobile-chat-message mobile-chat-message--${message.speaker}`} key={message.id}>
        {historyMode ? (
          <>
            <div className="mobile-history-avatar" aria-hidden="true">
              {message.speaker === "player" ? labels.you.slice(0, 1) : portraitUrl ? <img src={portraitUrl} alt="" /> : npcName.slice(0, 1)}
            </div>
            <div><strong>{message.speaker === "player" ? labels.you : message.speakerName}</strong><p>{message.text}</p><time>{getMessageTime(message)}</time></div>
          </>
        ) : (
          <><strong>{message.speakerName}</strong><p>{message.text}</p><time>{getMessageTime(message)}</time></>
        )}
      </article>
    )) : (
      <article className={historyMode ? "mobile-history-message mobile-history-message--npc" : "mobile-chat-message mobile-chat-message--npc"}>
        {historyMode ? <div className="mobile-history-avatar" aria-hidden="true">{npcName.slice(0, 1)}</div> : null}
        <div><strong>{npcName}</strong><p>{latestReply}</p><time>{String(hour).padStart(2, "0")}:00</time></div>
      </article>
    )
  );

  return (
    <section className={`mobile-event-scene${isKeyboardOpen ? " mobile-event-scene--keyboard" : ""}`}>
      <img className="mobile-event-scene__background" src={backgroundUrl} alt="" />
      <div className="mobile-event-scene__shade" aria-hidden="true" />

      <header className="mobile-event-hud">
        <button className="mobile-icon-button" type="button" onClick={onOpenMenu} aria-label={labels.menu}><span aria-hidden="true">=</span></button>
        <div className="mobile-event-hud__facts">
          <span>{labels.day} {day}</span><span>{labels.hour} {String(hour).padStart(2, "0")}:00</span>
          <span aria-label={labels.gold}>G {gold}</span><span aria-label={labels.weight}>W {weight}/{maxWeight}</span>
        </div>
      </header>

      <main className="mobile-event-scroll">
        <div className="mobile-npc-visual">
          {portraitUrl ? <img src={portraitUrl} alt="" draggable={false} /> : null}
          <div className="mobile-npc-quick-actions" aria-label={labels.dialogue}>
            <button type="button" onClick={() => setOpenSheet("history")} aria-label={labels.dialogueHistory}><span aria-hidden="true">H</span><small>{labels.dialogueHistory}</small></button>
            {quickActions.map((action) => (
              <button key={action.id} type="button" disabled={action.disabled} onClick={action.onSelect} aria-label={action.label}>
                <span aria-hidden="true">{action.icon}</span><small>{action.label}</small>
              </button>
            ))}
          </div>
        </div>

        <section className="mobile-npc-dialogue">
          <header className="mobile-npc-header">
            <div className="mobile-npc-header__identity"><strong>{npcName}</strong>{relationship !== undefined ? <span aria-label={labels.relationship}>R {relationship}</span> : null}</div>
            <div className="mobile-npc-header__actions"><button type="button" onClick={() => setOpenSheet("info")} aria-label={labels.npcInfo}><span aria-hidden="true">i</span></button></div>
          </header>

          {npcStats.length > 0 ? <div className="mobile-npc-stat-bars" aria-label={labels.relationship}>{npcStats.map((stat) => <span key={stat.label}><small>{stat.label}</small><i style={{ "--mobile-npc-stat-value": `${Math.max(4, Math.min(100, Number(stat.value) + 50))}%` } as CSSProperties} /></span>)}</div> : null}

          <div className="mobile-dialogue-card" ref={chatRef} role="log" aria-live="polite">
            {renderHistoryMessages()}
            {isThinking ? <article className="mobile-chat-message mobile-chat-message--thinking"><span className="mobile-typing-dots" aria-hidden="true"><i /><i /><i /></span><span>{labels.backendWaiting}</span></article> : null}
          </div>

          {statusContent ? <div className="mobile-event-status">{statusContent}</div> : null}
          {sceneContent ? <div className="mobile-event-scene-content">{sceneContent}</div> : null}

          {quickReplies.length > 0 && !isKeyboardOpen ? <section className="mobile-collapsible-panel">
            <button className="mobile-collapsible-panel__toggle" type="button" onClick={() => setShowSuggestions((current) => !current)} aria-expanded={showSuggestions}><span>{showSuggestions ? "-" : "+"}</span><strong>{labels.suggestions}</strong></button>
            {showSuggestions ? <div className="mobile-quick-replies" aria-label={labels.suggestions}>{quickReplies.map((reply) => <button type="button" key={reply.id} disabled={reply.disabled} onClick={() => void selectSuggestion(reply)}><span aria-hidden="true">{reply.icon ?? ">"}</span><span>{reply.label}</span><span aria-hidden="true">+</span></button>)}</div> : null}
          </section> : null}

          {!isKeyboardOpen ? <section className="mobile-collapsible-panel mobile-event-feed">
            <button className="mobile-collapsible-panel__toggle" type="button" onClick={() => setShowEvents((current) => !current)} aria-expanded={showEvents}><span>{showEvents ? "-" : "+"}</span><strong>{labels.events}</strong><small>{eventEntries.length}</small></button>
            {showEvents ? eventEntries.length > 0 ? <ul>{eventEntries.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul> : <p className="mobile-event-feed__empty">{labels.noEvents}</p> : null}
          </section> : null}

          {notice && eventEntries.length === 0 ? <p className="mobile-dialogue-notice">{notice}</p> : null}
          {actionContent ? <div className="mobile-event-actions">{actionContent}</div> : null}
        </section>
      </main>

      {!readOnly ? <form className="mobile-message-composer" onSubmit={(event) => { event.preventDefault(); void submitMessage(); }}>
        <button className="mobile-message-composer__voice" type="button" disabled aria-label={labels.voiceUnavailable}><span aria-hidden="true">o</span></button>
        <textarea ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleInputKeyDown} rows={1} placeholder={labels.writeMessage} aria-label={labels.writeMessage} disabled={disabled || isThinking || isSubmitting} />
        <button type="submit" disabled={!canSend} aria-label={labels.sendMessage}><span aria-hidden="true">&gt;</span></button>
      </form> : null}

      {onNavigate && !isKeyboardOpen ? <MobileBottomNavigation activeSection={null} onNavigate={onNavigate} /> : null}

      {openSheet ? <div className="mobile-sheet-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenSheet(null); }}>
        <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label={openSheet === "info" ? labels.npcInfo : labels.dialogueHistory}>
          <header className="mobile-sheet__header"><h2>{openSheet === "info" ? npcName : labels.dialogueHistory}</h2><button type="button" onClick={() => setOpenSheet(null)} aria-label={labels.close}>x</button></header>
          {openSheet === "info" ? <div className="mobile-sheet__scroll mobile-npc-info">
            <dl><div><dt>{labels.role}</dt><dd>{npcRole}</dd></div>{relationship !== undefined ? <div><dt>{labels.relationship}</dt><dd>{relationship}</dd></div> : null}{npcStats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
            {relationship !== undefined ? <meter min={-100} max={100} value={relationship}>{relationship}</meter> : null}
            {npcDescription ? <section><h3>{labels.about}</h3><p>{npcDescription}</p></section> : null}
            {relationshipSummary ? <section><h3>{labels.relationshipHistory}</h3><p>{relationshipSummary}</p></section> : null}
          </div> : <div className="mobile-sheet__scroll mobile-dialogue-history" ref={historyRef} role="log">{renderHistoryMessages(true)}</div>}
        </section>
      </div> : null}
    </section>
  );
}
