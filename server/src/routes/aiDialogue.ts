import { Router, type Request, type Response } from "express";

import type { AIActorRole, AIDialogueRequest, AIDialogueResponse } from "../types/ai.js";

const actorRoles = new Set<AIActorRole>(["npc", "companion", "dm", "system"]);

function isDialogueRequest(value: unknown): value is AIDialogueRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const request = value as Partial<AIDialogueRequest>;

  return (
    typeof request.actorId === "string" &&
    request.actorId.trim().length > 0 &&
    typeof request.actorName === "string" &&
    request.actorName.trim().length > 0 &&
    typeof request.actorRole === "string" &&
    actorRoles.has(request.actorRole as AIActorRole) &&
    typeof request.playerText === "string" &&
    request.playerText.trim().length > 0
  );
}

function getMockText(request: AIDialogueRequest) {
  if (request.actorId === "anariel") {
    return "Анариэль отвечает не сразу. Она смотрит на дорогу, потом тихо говорит: «Я слышу тебя. Пока настоящий голос мира ещё не пробуждён, но даже тишина может предупредить об опасности.»";
  }

  if (request.actorRole === "dm") {
    return "Мир откликается глухим эхом. Настоящий AI Dungeon Master ещё не подключён, но backend уже готов принять его голос.";
  }

  return "Персонаж внимательно слушает. Его настоящий AI-голос ещё не подключён, но этот backend endpoint уже готов к будущей интеграции.";
}

export const aiDialogueRouter = Router();

aiDialogueRouter.post("/api/ai/dialogue", (request: Request, response: Response) => {
  if (!isDialogueRequest(request.body)) {
    response.status(400).json({ error: "Invalid AI dialogue request" });
    return;
  }

  const result: AIDialogueResponse = {
    actorId: request.body.actorId,
    actorName: request.body.actorName,
    text: getMockText(request.body),
    isMock: true,
    source: "backend-mock",
  };

  response.json(result);
});
