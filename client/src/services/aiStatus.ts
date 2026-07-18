export type AIConnectionMode = "mock" | "backend" | "local";

export const AI_CONNECTION_MODE: AIConnectionMode = "mock";

export function getAIStatus() {
  return {
    mode: AI_CONNECTION_MODE,
    label: "AI Mock Mode",
    description: "Настоящий AI ещё не подключён. Игра использует временные атмосферные ответы.",
    isOnline: false,
  };
}
