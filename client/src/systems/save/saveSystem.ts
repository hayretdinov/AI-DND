import type { PlayerCharacter } from "../../types/player";
import type { WorldMapNodeId } from "../../data/worldMap";

const SAVE_KEY = "ai-dnd-save";

export type GameSave = {
  player: PlayerCharacter;
  currentLocationId?: WorldMapNodeId;
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getFallbackPortraitUrl(player: PlayerCharacter) {
  if (!player.race || !player.gender || !player.appearance) {
    return "";
  }

  const visualByAppearance: Record<PlayerCharacter["appearance"], string> = {
    wanderer: "starting",
    ash: "clothing",
    iron: "armor",
  };
  const visual = visualByAppearance[player.appearance] ?? "starting";

  return `/assets/characters/player/${player.race}/${player.gender}/${player.race}-${player.gender}-${visual}.png`;
}

function normalizeSave(data: GameSave): GameSave {
  return {
    ...data,
    player: {
      ...data.player,
      portraitUrl: data.player.portraitUrl || getFallbackPortraitUrl(data.player),
    },
  };
}

export function saveGame(data: GameSave) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data)));
}

export function loadGame(): GameSave | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawSave = storage.getItem(SAVE_KEY);

  if (!rawSave) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSave) as GameSave;
    if (!parsed.player) {
      return null;
    }

    const normalizedSave = normalizeSave(parsed);

    if (normalizedSave.player.portraitUrl !== parsed.player.portraitUrl) {
      storage.setItem(SAVE_KEY, JSON.stringify(normalizedSave));
    }

    return normalizedSave;
  } catch {
    return null;
  }
}

export function hasSave() {
  return loadGame() !== null;
}

export function deleteSave() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(SAVE_KEY);
}
