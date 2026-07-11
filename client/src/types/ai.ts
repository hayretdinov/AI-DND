export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LocalAiSettings = {
  baseUrl: string;
  modelId: string;
  enabled: boolean;
};
