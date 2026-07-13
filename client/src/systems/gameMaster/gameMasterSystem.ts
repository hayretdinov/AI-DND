import type { PlayerIntent } from "../intent/playerIntentSystem";
import type { GameSave } from "../save/saveSystem";
import type { NpcInstance } from "../../types/npc";
import type { PlayerAttackResult } from "../combat/combatSystem";

export type GameActionResult =
  | {
      type: "anariel.free" | "anariel.leave" | "event.retreat" | "event.observe" | "event.askItem";
      success: boolean;
      text: string;
    }
  | {
      type: "combat.attack";
      success: boolean;
      combat: PlayerAttackResult;
      enemyName: string;
    };

export type GameMasterContext = {
  language: "ru" | "en";
  sceneId: string;
  locationId?: string;
  eventId?: string;
  playerState: GameSave["player"];
  npcInstance?: NpcInstance;
  intent: PlayerIntent;
  gameResult: GameActionResult;
};

export type GameMasterNarration = {
  text: string;
  tone: "calm" | "tense" | "combat" | "fear" | "tragic" | "relief";
};

export function createGameMasterNarration(context: GameMasterContext): GameMasterNarration {
  const { gameResult, language } = context;
  const ru = language === "ru";

  if (gameResult.type === "anariel.free") {
    return {
      text: ru
        ? "Ты возишься с цепями, пока старый замок не поддается. Анариэль с трудом поднимается на ноги."
        : "You work at the chains until the old lock gives in. Anariel slowly rises to her feet.",
      tone: "relief",
    };
  }

  if (gameResult.type === "anariel.leave") {
    return {
      text: ru
        ? "Ты отворачиваешься от ее цепей и уходишь к дороге. Ее голос еще долго слышен за спиной."
        : "You turn away from her chains and walk back toward the road. Her voice lingers behind you for a long time.",
      tone: "tragic",
    };
  }

  if (gameResult.type === "combat.attack") {
    const combat = gameResult.combat;

    if (!combat.ok) {
      return {
        text: ru ? "Попытка срывается прежде, чем начинается." : "The attempt fails before it truly begins.",
        tone: "tense",
      };
    }

    if (combat.enemyDefeated) {
      return {
        text: ru
          ? `${gameResult.enemyName} падает на землю и больше не поднимается.`
          : `${gameResult.enemyName} falls to the ground and does not rise again.`,
        tone: "combat",
      };
    }

    return {
      text: combat.hit
        ? ru
          ? `${gameResult.enemyName} пошатывается, но еще держится на ногах.`
          : `${gameResult.enemyName} staggers, but stays on their feet.`
        : ru
          ? "Удар уходит в пустоту, и опасность остается рядом."
          : "The blow cuts through empty air, and the danger remains close.",
      tone: "combat",
    };
  }

  if (gameResult.type === "event.retreat") {
    return {
      text: gameResult.text,
      tone: "tense",
    };
  }

  return {
    text: gameResult.text,
    tone: gameResult.success ? "calm" : "tense",
  };
}
