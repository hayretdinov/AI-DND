import { AI_CONNECTION_MODE } from "./aiStatus";

export type AIActorRole = "npc" | "companion" | "dm" | "system";

export type AIMessage = {
  role: AIActorRole | "player";
  content: string;
};

export type AIDialogueRequest = {
  actorId: string;
  actorName: string;
  actorRole: AIActorRole;
  locationId?: string;
  playerText: string;
  recentMessages?: AIMessage[];
  gameContext?: Record<string, unknown>;
};

export type AIDialogueResponse = {
  actorId: string;
  actorName: string;
  text: string;
  isMock: boolean;
  source?: "local-mock" | "backend-mock" | "fallback-mock";
};

const MOCK_DELAY_MS = 180;
const DEFAULT_AI_BACKEND_URL = "https://ai-dnd-5l93.onrender.com/api/ai/dialogue";
const viteEnv = (import.meta as ImportMeta & { env?: { VITE_AI_BACKEND_URL?: string } }).env;
const AI_BACKEND_URL = viteEnv?.VITE_AI_BACKEND_URL?.trim() || DEFAULT_AI_BACKEND_URL;
const AI_RESPONSE_SOURCES = new Set<NonNullable<AIDialogueResponse["source"]>>([
  "local-mock",
  "backend-mock",
  "fallback-mock",
]);
const AI_ACTOR_ROLES = new Set<AIActorRole>(["npc", "companion", "dm", "system"]);

function prepareBackendRequest(request: AIDialogueRequest): AIDialogueRequest {
  const actorId = request.actorId.trim();
  const actorName = request.actorName.trim();
  const actorRole = request.actorRole;

  if (!actorId || !actorName || !actorRole || !AI_ACTOR_ROLES.has(actorRole)) {
    throw new Error("AI dialogue request is missing required actor fields");
  }

  const playerText = request.playerText.trim() || (
    request.gameContext?.language === "en"
      ? "Player waits silently. Respond in character."
      : "Игрок молча ждёт. Ответь от лица персонажа."
  );

  return {
    ...request,
    actorId,
    actorName,
    actorRole,
    playerText,
  };
}

function getMockText(request: AIDialogueRequest) {
  const isEnglish = request.gameContext?.language === "en";

  if (request.actorId === "anariel") {
    return isEnglish
      ? "Anariel studies you in silence. Her voice carries weariness, but no weakness: \"I hear you. When the world's true voice awakens, I will answer differently. Until then, be careful - the road rarely forgives haste.\""
      : "Анариэль внимательно смотрит на тебя. В её голосе слышна усталость, но не слабость: «Я слышу тебя. Когда настоящий голос мира проснётся, я отвечу иначе. А пока будь осторожен — дорога редко прощает спешку.»";
  }

  if (request.actorRole === "dm") {
    return isEnglish
      ? "The world is still silent without its true AI voice, but the shadows are already moving. An AI Dungeon Master response will appear here later."
      : "Мир пока молчит настоящим голосом ИИ, но тени уже двигаются. Позже здесь будет ответ AI Dungeon Master.";
  }

  return isEnglish
    ? "The character watches you as if searching for the right words. Real AI dialogue is not connected yet, but this scene is ready to receive it."
    : "Персонаж смотрит на тебя, словно подбирает слова. Настоящий AI dialogue ещё не подключён, но эта сцена уже готова принять его.";
}

async function requestMockDialogue(request: AIDialogueRequest): Promise<AIDialogueResponse> {
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, MOCK_DELAY_MS);
  });

  return {
    actorId: request.actorId,
    actorName: request.actorName,
    text: getMockText(request),
    isMock: true,
    source: "local-mock",
  };
}

function getFallbackText(request: AIDialogueRequest) {
  const isEnglish = request.gameContext?.language === "en";

  if (request.actorId === "anariel") {
    return isEnglish
      ? "Anariel listens to the silence, but the answer is lost somewhere beyond the road. While the backend connection is unavailable, she answers carefully: \"Do not rely on voices that may disappear. Think for yourself, and I will walk beside you.\""
      : "Анариэль вслушивается в тишину, но ответ теряется где-то за пределами дороги. Пока связь с backend недоступна, она отвечает осторожно: «Не стоит полагаться на голоса, которые могут исчезнуть. Думай сам — и я пойду рядом.»";
  }

  if (request.actorRole === "dm") {
    return isEnglish
      ? "The distant voice of the world fades before reaching you. The backend is temporarily unavailable, so the road answers only with wind and cautious silence."
      : "Далёкий голос мира затихает, не успев достичь тебя. Связь с backend временно недоступна, и дорога отвечает лишь ветром и осторожной тишиной.";
  }

  return isEnglish
    ? "The character pauses as the distant connection falls silent. The backend is temporarily unavailable, so a careful local response takes its place."
    : "Персонаж делает паузу, когда далёкая связь обрывается. Backend временно недоступен, поэтому его заменяет осторожный локальный ответ.";
}

function requestFallbackDialogue(request: AIDialogueRequest): AIDialogueResponse {
  return {
    actorId: request.actorId,
    actorName: request.actorName,
    text: getFallbackText(request),
    isMock: true,
    source: "fallback-mock",
  };
}

function isDialogueResponse(value: unknown): value is AIDialogueResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<AIDialogueResponse>;
  return (
    typeof response.actorId === "string" &&
    typeof response.actorName === "string" &&
    typeof response.text === "string" &&
    typeof response.isMock === "boolean" &&
    (response.source === undefined || AI_RESPONSE_SOURCES.has(response.source))
  );
}

async function requestBackendDialogue(request: AIDialogueRequest) {
  const response = await fetch(AI_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Backend dialogue request failed with status ${response.status}`);
  }

  const result: unknown = await response.json();
  if (!isDialogueResponse(result)) {
    throw new Error("Backend dialogue response has an invalid shape");
  }

  return result;
}

export async function requestAIDialogue(request: AIDialogueRequest): Promise<AIDialogueResponse> {
  if (AI_CONNECTION_MODE === "backend") {
    try {
      return await requestBackendDialogue(prepareBackendRequest(request));
    } catch (error) {
      console.warn("AI backend is unavailable; using the local fallback response.", error);
      return requestFallbackDialogue(request);
    }
  }

  return requestMockDialogue(request);
}
