import type { AiChatMessage, LocalAiSettings } from "../../types/ai";

export const LOCAL_AI_BASE_URL_KEY = "ai-dnd-local-ai-base-url";
export const LOCAL_AI_MODEL_ID_KEY = "ai-dnd-local-ai-model-id";
export const LOCAL_AI_ENABLED_KEY = "ai-dnd-local-ai-enabled";
export const DEFAULT_LOCAL_AI_BASE_URL = "http://127.0.0.1:1234/v1";
export const DEFAULT_LOCAL_AI_MODEL_ID = "deepseek/deepseek-r1-0528-qwen3-8b";
export const LOCAL_AI_PROXY_ENDPOINT = "/api/local-ai/v1/chat/completions";

type LocalAiRequestOptions = {
  settings?: LocalAiSettings;
  ignoreEnabled?: boolean;
  temperature?: number;
  maxTokens?: number;
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getLocalAiSettings(): LocalAiSettings {
  const storage = getStorage();

  if (!storage) {
    return {
      baseUrl: DEFAULT_LOCAL_AI_BASE_URL,
      modelId: DEFAULT_LOCAL_AI_MODEL_ID,
      enabled: false,
    };
  }

  return {
    baseUrl: storage.getItem(LOCAL_AI_BASE_URL_KEY) || DEFAULT_LOCAL_AI_BASE_URL,
    modelId: storage.getItem(LOCAL_AI_MODEL_ID_KEY) || DEFAULT_LOCAL_AI_MODEL_ID,
    enabled: storage.getItem(LOCAL_AI_ENABLED_KEY) === "true",
  };
}

export function saveLocalAiSettings(settings: LocalAiSettings) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(LOCAL_AI_BASE_URL_KEY, settings.baseUrl || DEFAULT_LOCAL_AI_BASE_URL);
  storage.setItem(LOCAL_AI_MODEL_ID_KEY, settings.modelId || DEFAULT_LOCAL_AI_MODEL_ID);
  storage.setItem(LOCAL_AI_ENABLED_KEY, String(settings.enabled));
}

export function normalizeLocalAiBaseUrl(baseUrl: string) {
  return (baseUrl || DEFAULT_LOCAL_AI_BASE_URL).trim().replace(/\/+$/, "");
}

export function getLocalAiChatCompletionsEndpoint(baseUrl: string) {
  return `${normalizeLocalAiBaseUrl(baseUrl)}/chat/completions`;
}

export function getBrowserLocalAiEndpoint() {
  return LOCAL_AI_PROXY_ENDPOINT;
}

export async function requestLocalChatCompletion(
  messages: AiChatMessage[],
  options: LocalAiRequestOptions = {},
) {
  const settings = options.settings ?? getLocalAiSettings();
  const baseUrl = settings.baseUrl || DEFAULT_LOCAL_AI_BASE_URL;
  const model = settings.modelId || DEFAULT_LOCAL_AI_MODEL_ID;
  const endpoint = getBrowserLocalAiEndpoint();

  if (!settings.enabled && !options.ignoreEnabled) {
    return { text: "", usedFallback: true, reason: "disabled" as const, endpoint, model };
  }

  try {
    console.info("[LocalAI] Request", { endpoint, model });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 350,
        stream: false,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("[LocalAI] Failed", {
        endpoint,
        model,
        status: response.status,
        errorBody: responseText,
        baseUrl,
      });

      return {
        text: "",
        usedFallback: true,
        reason: "unavailable" as const,
        status: response.status,
        errorBody: responseText,
        endpoint,
        model,
      };
    }

    const data = JSON.parse(responseText) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      console.warn("Local AI response content is empty", data);
    }

    console.info("[LocalAI] Success", data);

    return text
      ? { text, usedFallback: false, reason: "" as const }
      : { text: "", usedFallback: true, reason: "empty" as const, endpoint, model };
  } catch (error) {
    console.error("[LocalAI] Failed", {
      endpoint,
      model,
      status: "network",
      errorBody: error instanceof Error ? error.message : String(error),
      baseUrl,
    });

    return {
      text: "",
      usedFallback: true,
      reason: "unavailable" as const,
      status: "network",
      errorBody: error instanceof Error ? error.message : String(error),
      endpoint,
      model,
    };
  }
}
