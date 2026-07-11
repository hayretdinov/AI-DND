import type { PlayerCharacter } from "../../types/player";
import type { WorldMapNodeId } from "../../data/worldMap";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import type { EquipmentSlot, InventoryItem, InventoryState } from "../../types/inventory";

const SAVE_KEY = "ai-dnd-save";
const DEFAULT_TRAVEL_ENERGY_MAX = 100;
const DEFAULT_DAY = 1;
const DEFAULT_HOUR = 6;

export type TravelEnergyState = {
  currentEnergy: number;
  maxEnergy: number;
  lastRestDay: number;
};

export type AnarielCompanionState = {
  met: boolean;
  status: "unknown" | "rescued" | "ignored";
  isTravellingWithPlayer: boolean;
  introEventSeen: boolean;
  relationship: number;
};

export type CompanionsState = {
  anariel: AnarielCompanionState;
};

export type GameSave = {
  player: PlayerCharacter;
  currentLocationId?: WorldMapNodeId;
  currentDay?: number;
  currentHour?: number;
  travelEnergy?: TravelEnergyState;
  inventory?: InventoryState;
  companions?: CompanionsState;
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

export function createInitialAnarielCompanionState(): AnarielCompanionState {
  return {
    met: false,
    status: "unknown",
    isTravellingWithPlayer: false,
    introEventSeen: false,
    relationship: 0,
  };
}

function getMigratedAnarielCompanionState(): AnarielCompanionState {
  return {
    met: false,
    status: "unknown",
    isTravellingWithPlayer: false,
    introEventSeen: true,
    relationship: 0,
  };
}

function normalizeAnarielCompanionState(data: Partial<GameSave>): AnarielCompanionState {
  const fallbackState = getMigratedAnarielCompanionState();
  const sourceState = data.companions?.anariel;
  const status = sourceState?.status;
  const normalizedStatus = status === "rescued" || status === "ignored" || status === "unknown"
    ? status
    : fallbackState.status;
  const relationship = Number.isFinite(sourceState?.relationship)
    ? Number(sourceState?.relationship)
    : fallbackState.relationship;

  return {
    met: Boolean(sourceState?.met ?? fallbackState.met),
    status: normalizedStatus,
    isTravellingWithPlayer: Boolean(sourceState?.isTravellingWithPlayer ?? fallbackState.isTravellingWithPlayer),
    introEventSeen: Boolean(sourceState?.introEventSeen ?? fallbackState.introEventSeen),
    relationship,
  };
}

function normalizeCompanions(data: Partial<GameSave>): CompanionsState {
  return {
    anariel: normalizeAnarielCompanionState(data),
  };
}

function normalizeEquipmentSlot(slot: string): EquipmentSlot | null {
  const legacySlots: Record<string, EquipmentSlot> = {
    accessory1: "ring1",
    accessory2: "amulet",
    leftHand: "offHand",
    rightHand: "mainHand",
  };
  const normalizedSlot = legacySlots[slot] ?? slot;
  const validSlots = new Set<EquipmentSlot>([
    "amulet",
    "back",
    "bag",
    "belt",
    "boots",
    "chest",
    "gloves",
    "head",
    "mainHand",
    "offHand",
    "ring1",
    "ring2",
  ]);

  return validSlots.has(normalizedSlot as EquipmentSlot) ? (normalizedSlot as EquipmentSlot) : null;
}

function normalizeInventoryCategory(
  category: InventoryItem["category"] | string | undefined,
  fallbackCategory: InventoryItem["category"],
): InventoryItem["category"] {
  const legacyCategories: Record<string, InventoryItem["category"]> = {
    books: "quest",
    consumables: "consumable",
    keys: "misc",
    materials: "material",
    weapons: "weapon",
  };
  const normalizedCategory = category ? legacyCategories[category] ?? category : fallbackCategory;
  const validCategories = new Set<InventoryItem["category"]>([
    "armor",
    "consumable",
    "material",
    "misc",
    "quest",
    "weapon",
  ]);

  return validCategories.has(normalizedCategory as InventoryItem["category"])
    ? (normalizedCategory as InventoryItem["category"])
    : fallbackCategory;
}

function normalizeInventoryItem(item: Partial<InventoryItem>, fallbackItem: InventoryItem): InventoryItem {
  const slot = item.slot ? normalizeEquipmentSlot(item.slot) ?? undefined : undefined;
  const isQuestItem = Boolean(item.isQuestItem ?? item.questItem);

  return {
    ...fallbackItem,
    ...item,
    category: normalizeInventoryCategory(item.category, fallbackItem.category),
    createdAt: item.createdAt || fallbackItem.createdAt,
    equippable: Boolean(item.equippable ?? fallbackItem.equippable),
    icon: item.icon || fallbackItem.icon,
    id: item.id || fallbackItem.id,
    isQuestItem,
    questItem: isQuestItem,
    quantity: Number.isFinite(item.quantity) ? Math.max(0, Number(item.quantity)) : fallbackItem.quantity,
    rarity: item.rarity ?? fallbackItem.rarity,
    slot,
    stats: item.stats ?? item.bonuses ?? fallbackItem.stats,
    bonuses: item.bonuses ?? item.stats ?? fallbackItem.bonuses,
    templateId: item.templateId || item.id || fallbackItem.templateId,
    value: Number.isFinite(item.value) ? Number(item.value) : fallbackItem.value,
    weight: Number.isFinite(item.weight) ? Math.max(0, Number(item.weight)) : fallbackItem.weight,
  };
}

function normalizeInventory(data: Partial<GameSave>): InventoryState {
  const fallbackInventory = createDefaultInventoryState();
  const sourceInventory = data.inventory;
  const sourceItems = Array.isArray(sourceInventory?.items) ? sourceInventory.items : fallbackInventory.items;
  const normalizedItems = sourceItems
    .map((item, index) => normalizeInventoryItem(item, fallbackInventory.items[index] ?? fallbackInventory.items[0]))
    .filter((item) => item.quantity > 0);
  const itemIds = new Set(normalizedItems.map((item) => item.id));
  const sourceEquipment = sourceInventory?.equipment ?? fallbackInventory.equipment;
  const normalizedEquipment: InventoryState["equipment"] = {};

  for (const [slot, itemId] of Object.entries(sourceEquipment)) {
    const normalizedSlot = normalizeEquipmentSlot(slot);

    if (normalizedSlot && typeof itemId === "string" && itemIds.has(itemId)) {
      normalizedEquipment[normalizedSlot] = itemId;
    }
  }

  return {
    equipment: normalizedEquipment,
    gold: Number.isFinite(sourceInventory?.gold) ? Number(sourceInventory?.gold) : 0,
    items: normalizedItems.length > 0 ? normalizedItems : fallbackInventory.items,
    maxCarryWeight: Number.isFinite(sourceInventory?.maxCarryWeight)
      ? Math.max(1, Number(sourceInventory?.maxCarryWeight))
      : fallbackInventory.maxCarryWeight,
  };
}

function normalizeSave(data: GameSave) {
  const normalizedSave: GameSave = {
    ...data,
    currentDay: Number.isFinite(data.currentDay) ? data.currentDay : DEFAULT_DAY,
    currentHour: Number.isFinite(data.currentHour) ? data.currentHour : DEFAULT_HOUR,
    companions: normalizeCompanions(data),
    inventory: normalizeInventory(data),
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
    JSON.stringify(normalizedSave.companions) !== JSON.stringify(data.companions) ||
    JSON.stringify(normalizedSave.inventory) !== JSON.stringify(data.inventory) ||
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
