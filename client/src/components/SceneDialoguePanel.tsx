import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { isBlankDialogueMessage, shouldSubmitDialogueKey } from "./dialogueInputUtils";
import { t } from "../i18n/i18n";

export type SceneDialogueMessage = {
  id: string;
  speaker: "player" | "npc" | "game_master" | "combat" | "system";
  text: string;
  speakerName: string;
};

type SceneDialoguePanelProps = {
  title: string;
  speakerName: string;
  speakerRole: string;
  speakerPortraitUrl?: string;
  speakerFallback?: string;
  messages: SceneDialogueMessage[];
  emptyText: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  isThinking: boolean;
  thinkingText?: string;
  notice?: string;
  disabled?: boolean;
  readOnly?: boolean;
  stats?: Array<{ label: string; value: string | number }>;
  headerActions?: ReactNode;
  actions?: ReactNode;
};

export function SceneDialoguePanel({
  title,
  speakerName,
  speakerRole,
  speakerPortraitUrl,
  speakerFallback,
  messages,
  emptyText,
  value,
  onChange,
  onSend,
  isThinking,
  thinkingText,
  notice,
  disabled = false,
  readOnly = false,
  stats = [],
  headerActions,
  actions,
}: SceneDialoguePanelProps) {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSend = !disabled && !readOnly && !isThinking && !isSubmitting && !isBlankDialogueMessage(value);

  useEffect(() => {
    const element = messagesRef.current;

    if (!element || !shouldStickToBottomRef.current) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages.length, isThinking, notice]);

  const handleMessagesScroll = () => {
    const element = messagesRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 56;
  };

  const submitMessage = async () => {
    if (!canSend) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSend();
      shouldStickToBottomRef.current = true;
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
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

  return (
    <section className="scene-dialogue-panel" aria-label={title}>
      <header className="scene-dialogue-header">
        <div className="scene-dialogue-speaker">
          <div className="scene-dialogue-portrait" aria-hidden="true">
            {speakerPortraitUrl ? <img src={speakerPortraitUrl} alt="" draggable={false} /> : null}
            <span>{speakerFallback ?? speakerName.slice(0, 1)}</span>
          </div>
          <div>
            <p className="scene-dialogue-role">{speakerRole}</p>
            <h2>{speakerName}</h2>
          </div>
        </div>
        <div className="scene-dialogue-header-tools">
          {stats.length > 0 ? (
            <dl className="scene-dialogue-stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {headerActions ? <div className="scene-dialogue-header-actions">{headerActions}</div> : null}
        </div>
      </header>

      <div className="scene-dialogue-messages" ref={messagesRef} role="log" aria-live="polite" onScroll={handleMessagesScroll}>
        {messages.length > 0 ? (
          messages.map((message) => (
            <article className={`scene-dialogue-message scene-dialogue-message--${message.speaker}`} key={message.id}>
              <strong>{message.speakerName}</strong>
              <p>{message.text}</p>
            </article>
          ))
        ) : (
          <p className="scene-dialogue-empty">{emptyText}</p>
        )}
        {isThinking ? <p className="scene-dialogue-thinking">{thinkingText ?? `${speakerName} ${t("sceneDialogue.thinking")}`}</p> : null}
      </div>

      {notice ? <p className="scene-dialogue-notice">{notice}</p> : null}
      {actions ? <div className="scene-dialogue-actions">{actions}</div> : null}

      {!readOnly ? (
        <form
          className="scene-dialogue-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage();
          }}
        >
          <textarea
            className="scene-dialogue-input"
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("dialogue.inputPlaceholder")}
            rows={2}
            disabled={disabled || isThinking || isSubmitting}
          />
          <button className="scene-dialogue-send" type="submit" disabled={!canSend}>
            {isSubmitting || isThinking ? t("dialogue.sending") : t("dialogue.send")}
          </button>
        </form>
      ) : null}
    </section>
  );
}
