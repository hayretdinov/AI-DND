export type AppEventName =
  | "LORE_LOADING_STARTED"
  | "LORE_LOADING_FINISHED"
  | "LORE_LOADING_FAILED"
  | "LORE_CONTEXT_BUILT"
  | "LORE_VALIDATION_FAILED"
  | "NPC_KNOWLEDGE_LEARNED"
  | "NPC_RUMOR_LEARNED"
  | "NPC_DIALOGUE_GENERATED";

export type AppEventPayload = {
  eventName: AppEventName;
  createdAt: string;
  details: Record<string, string | number | boolean | undefined>;
};

type AppEventListener = (payload: AppEventPayload) => void;

export class AppEventBus {
  private readonly listeners = new Map<AppEventName, Set<AppEventListener>>();

  /** Subscribe to a typed app event and receive an unsubscribe callback. */
  subscribe(eventName: AppEventName, listener: AppEventListener) {
    const listeners = this.listeners.get(eventName) ?? new Set<AppEventListener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);

    return () => {
      listeners.delete(listener);
    };
  }

  /** Emit a typed app event to local subscribers and the debug console. */
  emit(eventName: AppEventName, details: AppEventPayload["details"] = {}) {
    const payload: AppEventPayload = {
      eventName,
      createdAt: new Date().toISOString(),
      details,
    };

    console.info(`[EventBus] ${eventName}`, details);
    this.listeners.get(eventName)?.forEach((listener) => listener(payload));
  }
}

export const appEventBus = new AppEventBus();
