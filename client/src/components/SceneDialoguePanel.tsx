import { useEffect, useRef, type KeyboardEvent } from "react";
import { t } from "../i18n/i18n";

export type SceneDialogueMessage = {
  id: string;
  speaker: "player" | "npc";
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
  onSend: () => void;
  isThinking: boolean;
  thinkingText?: string;
  notice?: string;
  disabled?: boolean;
  readOnly?: boolean;
  stats?: Array<{ label: string; value: string | number }>;
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
}: SceneDialoguePanelProps) {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const canSend = !disabled && !readOnly && !isThinking && value.trim().length > 0;

  useEffect(() => {
    const element = messagesRef.current;

    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages.length, isThinking, notice]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (canSend) {
      onSend();
    }
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
      </header>

      <div className="scene-dialogue-messages" ref={messagesRef} aria-live="polite">
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

      {!readOnly ? (
        <form
          className="scene-dialogue-input-row"
          onSubmit={(event) => {
            event.preventDefault();

            if (canSend) {
              onSend();
            }
          }}
        >
          <textarea
            className="scene-dialogue-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("sceneDialogue.placeholder")}
            rows={2}
            disabled={disabled || isThinking}
          />
          <button className="scene-dialogue-send" type="submit" disabled={!canSend}>
            {t("sceneDialogue.send")}
          </button>
        </form>
      ) : null}
    </section>
  );
}
