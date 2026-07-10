import type { PlayerCharacter } from "../../types/player";
import type { WorldMapNodeId } from "../../data/worldMap";

const SAVE_KEY = "ai-dnd-save";
const DEFAULT_TRAVEL_ENERGY_MAX = 100;
const DEFAULT_DAY = 1;
const DEFAULT_HOUR = 6;

export type TravelEnergyState = {
  currentEnergy: number;
  maxEnergy: number;
  lastRestDay: number;
};

export type GameSave = {
  player: PlayerCharacter;
  currentLocationId?: WorldMapNodeId;
  currentDay?: number;
  currentHour?: number;
  travelEnergy?: TravelEnergyState;
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

function normalizeTravelEnergy(data: Partial<GameSave>): TravelEnergyState {
  const currentDay = Number.isFinite(data.currentDay) ? Number(data.currentDay) : DEFAULT_DAY;
  const storedMaxEnergy = data.travelEnergy?.maxEnergy;
  const storedCurrentEnergy = data.travelEnergy?.currentEnergy;
  const storedLastRestDay = data.travelEnergy?.lastRestDay;
  const maxEnergy = Number.isFinite(storedMaxEnergy)
    ? Math.max(1, Number(storedMaxEnergy))
    : DEFAULT_TRAVEL_ENERGY_MAX;
  const currentEnergy = Number.isFinite(storedCurrentEnergy)
    ? Math.min(maxEnergy, Math.max(0, Number(storedCurrentEnergy)))
    : maxEnergy;
  const lastRestDay = Number.isFinite(storedLastRestDay)
    ? Number(storedLastRestDay)
    : currentDay;

  return { currentEnergy, maxEnergy, lastRestDay };
}

function normalizeSave(data: GameSave) {
  const normalizedSave: GameSave = {
    ...data,
    currentDay: Number.isFinite(data.currentDay) ? data.currentDay : DEFAULT_DAY,
    currentHour: Number.isFinite(data.currentHour) ? data.currentHour : DEFAULT_HOUR,
    travelEnergy: normalizeTravelEnergy(data),
    player: {
      ...data.player,
      portraitUrl: data.player.portraitUrl || getFallbackPortraitUrl(data.player),
    },
  };
  const changed =
    normalizedSave.currentDay !== data.currentDay ||
    normalizedSave.currentHour !== data.currentHour ||
    normalizedSave.travelEnergy?.currentEnergy !== data.travelEnergy?.currentEnergy ||
    normalizedSave.travelEnergy?.maxEnergy !== data.travelEnergy?.maxEnergy ||
    normalizedSave.travelEnergy?.lastRestDay !== data.travelEnergy?.lastRestDay ||
    normalizedSave.player.portraitUrl !== data.player.portraitUrl;

  return { save: normalizedSave, changed };
}

export function saveGame(data: GameSave) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data).save));
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

    const normalized = normalizeSave(parsed);

    if (normalized.changed) {
      storage.setItem(SAVE_KEY, JSON.stringify(normalized.save));
    }

    return normalized.save;
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
