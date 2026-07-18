export type AIActorRole = "npc" | "companion" | "dm" | "system";

export type AIMessage = {
  role: AIActorRole;
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
};

const MOCK_DELAY_MS = 180;

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

export async function requestAIDialogue(request: AIDialogueRequest): Promise<AIDialogueResponse> {
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, MOCK_DELAY_MS);
  });

  return {
    actorId: request.actorId,
    actorName: request.actorName,
    text: getMockText(request),
    isMock: true,
  };
}
