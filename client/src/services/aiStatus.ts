export type AIConnectionMode = "mock" | "backend" | "local";

export const AI_CONNECTION_MODE: AIConnectionMode = "backend";

export function getAIStatus() {
  if (AI_CONNECTION_MODE === "backend") {
    return {
      mode: AI_CONNECTION_MODE,
      label: "Backend AI Mock Mode",
      description: "Игра отправляет диалоги на backend. Настоящий AI ещё не подключён, backend возвращает безопасные mock-ответы.",
      isOnline: true,
    };
  }

  return {
    mode: AI_CONNECTION_MODE,
    label: "AI Mock Mode",
    description: "Настоящий AI ещё не подключён. Игра использует временные атмосферные ответы.",
    isOnline: false,
  };
}
