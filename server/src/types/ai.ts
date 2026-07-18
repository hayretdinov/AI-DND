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
  source: "backend-mock";
};
