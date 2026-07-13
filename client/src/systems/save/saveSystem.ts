import type { PlayerCharacter, PlayerOutfitStage } from "../../types/player";
import {
  WORLD_MAP_START_NODE_ID,
  isWorldMapNodeId,
  type WorldMapNodeId,
} from "../../data/worldMap";
import { ROYAL_COURT_NPC_IDS, getRoyalCourtNpcById } from "../../data/royalCourtNpcs";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import { getItemTemplateById } from "../../data/itemRegistry";
import type { CityAccessRecord, CityAccessState, CityId, CityState, NavigationReturnContext } from "../../types/city";
import type { CompanionDialogueMessage } from "../../types/companion";
import type { AttackAttribute, DamageType, WeaponType } from "../../types/combat";
import type { ActiveEventContext } from "../../types/events";
import type { EquipmentSlot, InventoryItem, InventoryState } from "../../types/inventory";
import type { MerchantDeal, MerchantState, MerchantTradeMemory, MerchantsState } from "../../types/merchant";
import type { NpcInstance, NpcRole, NpcRuntimeState, NpcStatus } from "../../types/npc";
import { isWeaponType } from "../combat/combatValidation";
import { normalizeNpcCombatState } from "../combat/combatSystem";
import { normalizePlayerProgression } from "../player/playerProgressionSystem";

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
  status: "unknown" | "rescued" | "ignored" | "companion";
  isTravellingWithPlayer: boolean;
  introEventSeen: boolean;
  relationship: number;
  trust: number;
  fear: number;
  respect: number;
  lastDialogueSummary?: string;
  dialogueHistory: CompanionDialogueMessage[];
};

export type CompanionsState = {
  anariel: AnarielCompanionState;
};

export type TravelEventsState = {
  seenEventIds: string[];
};

export type NpcsState = {
  templatesKnown?: string[];
  instances: Record<string, NpcInstance>;
};

export type GameSave = {
  player: PlayerCharacter;
  currentLocationId?: WorldMapNodeId;
  currentDay?: number;
  currentHour?: number;
  travelEnergy?: TravelEnergyState;
  inventory?: InventoryState;
  companions?: CompanionsState;
  npcs?: NpcsState;
  merchants?: MerchantsState;
  cityAccess?: CityAccessState;
  cityState?: CityState;
  navigationReturnContext?: NavigationReturnContext;
  travelEvents?: TravelEventsState;
  activeEvent?: ActiveEventContext | null;
};

function isCityId(value: unknown): value is CityId {
  return value === "western_great_city" || value === "central_settlement";
}

function isCityAccessStatus(value: unknown): value is CityAccessRecord["status"] {
  return value === "unknown" || value === "allowed" || value === "denied" || value === "conditional";
}

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
  const visualByOutfitStage: Record<PlayerOutfitStage, string> = {
    rags: "starting",
    clothes: "clothing",
    armor: "armor",
  };
  const visual = player.currentOutfitStage
    ? visualByOutfitStage[player.currentOutfitStage]
    : visualByAppearance[player.appearance] ?? "starting";

  return `/assets/characters/player/${player.race}/${player.gender}/${player.race}-${player.gender}-${visual}.png`;
}

function isPlayerOutfitStage(value: unknown): value is PlayerOutfitStage {
  return value === "rags" || value === "clothes" || value === "armor";
}

function normalizePlayerOutfitStage(value: unknown): PlayerOutfitStage {
  return isPlayerOutfitStage(value) ? value : "rags";
}

function normalizeUnlockedOutfitStages(value: unknown): PlayerOutfitStage[] {
  const stages = Array.isArray(value) ? value.filter(isPlayerOutfitStage) : [];

  return stages.includes("rags") ? stages : ["rags", ...stages];
}

function clampCompanionMetric(value: unknown, fallback: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Number(value))) : fallback;
}

function normalizeDialogueHistory(value: unknown): CompanionDialogueMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is CompanionDialogueMessage => {
      const candidate = message as Partial<CompanionDialogueMessage>;
      return (
        (candidate.speaker === "player" || candidate.speaker === "anariel") &&
        typeof candidate.text === "string" &&
        typeof candidate.createdAt === "string"
      );
    })
    .map((message) => ({
      id: message.id || `dialogue-${message.createdAt}`,
      speaker: message.speaker,
      text: message.text,
      createdAt: message.createdAt,
    }))
    .slice(-20);
}

function normalizeNpcDialogueHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message) => {
      const candidate = message as Partial<NpcRuntimeState["dialogueHistory"][number]>;
      return (
        (candidate.speaker === "player" || candidate.speaker === "npc") &&
        typeof candidate.text === "string" &&
        typeof candidate.createdAt === "string"
      );
    })
    .map((message) => ({
      id: message.id || `npc-dialogue-${message.createdAt}`,
      speaker: message.speaker,
      text: message.text,
      createdAt: message.createdAt,
    }))
    .slice(-20);
}

function isNpcRole(value: unknown): value is NpcRole {
  return (
    value === "guard" ||
    value === "bandit" ||
    value === "monster" ||
    value === "merchant" ||
    value === "civilian" ||
    value === "companion" ||
    value === "ruler" ||
    value === "mage" ||
    value === "priest" ||
    value === "military" ||
    value === "noble" ||
    value === "scholar" ||
    value === "blacksmith"
  );
}

function isNpcStatus(value: unknown): value is NpcStatus {
  return (
    value === "alive" ||
    value === "dead" ||
    value === "escaped" ||
    value === "gone" ||
    value === "missing" ||
    value === "imprisoned" ||
    value === "exiled"
  );
}

function inferNpcRole(templateId: string): NpcRole {
  if (templateId.includes("guard")) {
    return "guard";
  }

  if (templateId.includes("bandit")) {
    return "bandit";
  }

  if (templateId.includes("beast") || templateId.includes("serpent") || templateId.includes("rat") || templateId.includes("zombie") || templateId.includes("skeleton")) {
    return "monster";
  }

  return "civilian";
}

function normalizeNpcInstance(instanceId: string, value: unknown): NpcInstance {
  const source = (value ?? {}) as Partial<NpcInstance & NpcRuntimeState>;
  const templateId =
    typeof source.templateId === "string"
      ? source.templateId
      : typeof source.npcId === "string" && source.npcId !== instanceId
        ? source.npcId
        : instanceId;
  const createdOnRoute =
    source.createdOnRoute &&
    isWorldMapNodeId(source.createdOnRoute.fromId) &&
    isWorldMapNodeId(source.createdOnRoute.toId)
      ? {
          fromId: source.createdOnRoute.fromId,
          toId: source.createdOnRoute.toId,
        }
      : undefined;
  const role = isNpcRole(source.role) ? source.role : inferNpcRole(templateId);
  const combat = source.combat ? normalizeNpcCombatState(templateId, role, source.combat) : undefined;

  return {
    npcId: instanceId,
    instanceId,
    templateId,
    role,
    status: isNpcStatus(source.status) ? source.status : "alive",
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date(0).toISOString(),
    createdDuringEventId: typeof source.createdDuringEventId === "string" ? source.createdDuringEventId : undefined,
    createdOnRoute,
    met: Boolean(source.met),
    relationship: clampCompanionMetric(source.relationship, 0),
    trust: clampCompanionMetric(source.trust, 0),
    fear: clampCompanionMetric(source.fear, 0),
    hostility: clampCompanionMetric(source.hostility, 0),
    dialogueHistory: normalizeNpcDialogueHistory(source.dialogueHistory),
    combat: combat
      ? {
          ...combat,
          currentHealth: source.status === "dead" ? 0 : combat.currentHealth,
          isDefeated: source.status === "dead" || combat.isDefeated,
        }
      : undefined,
  };
}

function normalizeNpcs(value: unknown): NpcsState {
  if (!value || typeof value !== "object") {
    return {
      instances: Object.fromEntries(
        ROYAL_COURT_NPC_IDS.map((npcId) => [npcId, createDefaultPersistentNpcInstance(npcId)]),
      ),
    };
  }

  const source = value as Partial<NpcsState> & Record<string, unknown>;
  const hasInstanceContainer = Boolean(source.instances && typeof source.instances === "object" && !Array.isArray(source.instances));
  const rawInstances = hasInstanceContainer ? source.instances as Record<string, unknown> : source;
  const instances = Object.fromEntries(
    Object.entries(rawInstances).map(([instanceId, state]) => [instanceId, normalizeNpcInstance(instanceId, state)]),
  );

  for (const npcId of ROYAL_COURT_NPC_IDS) {
    if (!instances[npcId]) {
      instances[npcId] = createDefaultPersistentNpcInstance(npcId);
    }
  }

  return {
    templatesKnown: Array.isArray(source.templatesKnown)
      ? source.templatesKnown.filter((templateId): templateId is string => typeof templateId === "string")
      : undefined,
    instances,
  };
}

function createDefaultPersistentNpcInstance(npcId: string): NpcInstance {
  const template = getRoyalCourtNpcById(npcId);
  const role = template?.role ?? inferNpcRole(npcId);

  return {
    npcId,
    instanceId: npcId,
    templateId: npcId,
    role,
    status: "alive",
    createdAt: new Date(0).toISOString(),
    met: false,
    relationship: 0,
    trust: 0,
    fear: 0,
    hostility: 0,
    dialogueHistory: [],
    combat: normalizeNpcCombatState(npcId, role),
  };
}

function normalizeTravelEvents(value: unknown): TravelEventsState {
  const source = (value ?? {}) as Partial<TravelEventsState>;

  return {
    seenEventIds: Array.isArray(source.seenEventIds)
      ? source.seenEventIds.filter((eventId): eventId is string => typeof eventId === "string")
      : [],
  };
}

function normalizeActiveEvent(value: unknown): ActiveEventContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<ActiveEventContext>;

  if (typeof source.eventId !== "string") {
    return null;
  }

  return {
    eventId: source.eventId,
    npcId: typeof source.npcId === "string" ? source.npcId : undefined,
    npcTemplateId: typeof source.npcTemplateId === "string" ? source.npcTemplateId : undefined,
    npcInstanceId: typeof source.npcInstanceId === "string" ? source.npcInstanceId : undefined,
    returnTo: source.returnTo === "cityMap" ? "cityMap" : "worldMap",
    cityId: typeof source.cityId === "string" ? source.cityId : undefined,
    cityLocationId: typeof source.cityLocationId === "string" ? source.cityLocationId : undefined,
    pendingTravelTargetId: isWorldMapNodeId(source.pendingTravelTargetId) ? source.pendingTravelTargetId : undefined,
    resumeTravelAfterEvent: Boolean(source.resumeTravelAfterEvent),
  };
}

function normalizeCityAccessRecord(value: unknown): CityAccessRecord {
  const source = (value ?? {}) as Partial<CityAccessRecord>;

  return {
    status: isCityAccessStatus(source.status) ? source.status : "unknown",
    grantedByNpcId: typeof source.grantedByNpcId === "string" ? source.grantedByNpcId : undefined,
    grantedAtGameTime: typeof source.grantedAtGameTime === "string" ? source.grantedAtGameTime : undefined,
    revokedReason: typeof source.revokedReason === "string" ? source.revokedReason : undefined,
  };
}

function normalizeCityAccess(value: unknown): CityAccessState {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    western_great_city: normalizeCityAccessRecord(source.western_great_city),
    central_settlement: normalizeCityAccessRecord(source.central_settlement),
  };
}

function normalizeCityState(value: unknown): CityState {
  const source = (value ?? {}) as Partial<CityState>;
  const discoveredLocationIds = Array.isArray(source.discoveredLocationIds)
    ? source.discoveredLocationIds.filter((locationId): locationId is string => typeof locationId === "string")
    : [];

  return {
    currentCityId: isCityId(source.currentCityId) ? source.currentCityId : undefined,
    currentCityLocationId: typeof source.currentCityLocationId === "string"
      ? source.currentCityLocationId
      : source.currentCityId === "central_settlement"
        ? "central_south_gate"
        : "western_gate",
    lastVisitedNpcId: typeof source.lastVisitedNpcId === "string" ? source.lastVisitedNpcId : undefined,
    discoveredLocationIds: Array.from(new Set([
      "western_gate",
      "main_square",
      "city_market",
      "central_south_gate",
      "central_market_square",
      "central_common_house",
      ...discoveredLocationIds,
    ])),
  };
}

function normalizeNavigationReturnContext(value: unknown): NavigationReturnContext | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<NavigationReturnContext>;

  if (source.screen !== "eventScene" && source.screen !== "merchantScene" && source.screen !== "cityMap") {
    return undefined;
  }

  return {
    screen: source.screen,
    cityId: isCityId(source.cityId) ? source.cityId : undefined,
    locationId: typeof source.locationId === "string" ? source.locationId : undefined,
    npcInstanceId: typeof source.npcInstanceId === "string" ? source.npcInstanceId : undefined,
    eventId: typeof source.eventId === "string" ? source.eventId : undefined,
    sceneMode: typeof source.sceneMode === "string" ? source.sceneMode : undefined,
  };
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

function migrateLegacyWorldMapLocationId(locationId: unknown): WorldMapNodeId {
  if (isWorldMapNodeId(locationId)) {
    return locationId;
  }

  if (typeof locationId !== "string") {
    return WORLD_MAP_START_NODE_ID;
  }

  if (locationId.startsWith("road_center") || locationId === "road_east_01") {
    return "central_settlement";
  }

  if (locationId.startsWith("road_west") || locationId.startsWith("road_southwest")) {
    return "western_great_city";
  }

  if (locationId.startsWith("road_south")) {
    return "southern_castle";
  }

  if (locationId.startsWith("road_north") || locationId === "road_lake_crossing") {
    return "northern_castle";
  }

  if (locationId.startsWith("road_marsh")) {
    return "swamp_location";
  }

  if (locationId.startsWith("road_dark") || locationId.includes("necropolis")) {
    return "necropolis_skull_castle";
  }

  if (locationId.startsWith("road_volcanic")) {
    return "volcanic_lava_location";
  }

  return WORLD_MAP_START_NODE_ID;
}

export function createInitialAnarielCompanionState(): AnarielCompanionState {
  return {
    met: false,
    status: "unknown",
    isTravellingWithPlayer: false,
    introEventSeen: false,
    relationship: 0,
    trust: 0,
    fear: 0,
    respect: 0,
    dialogueHistory: [],
  };
}

function getMigratedAnarielCompanionState(): AnarielCompanionState {
  return {
    met: false,
    status: "unknown",
    isTravellingWithPlayer: false,
    introEventSeen: true,
    relationship: 0,
    trust: 0,
    fear: 0,
    respect: 0,
    dialogueHistory: [],
  };
}

function normalizeAnarielCompanionState(data: Partial<GameSave>): AnarielCompanionState {
  const fallbackState = getMigratedAnarielCompanionState();
  const sourceState = data.companions?.anariel;
  const status = sourceState?.status;
  const normalizedStatus =
    status === "rescued" || status === "ignored" || status === "unknown" || status === "companion"
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
    relationship: clampCompanionMetric(relationship, fallbackState.relationship),
    trust: clampCompanionMetric(sourceState?.trust, fallbackState.trust),
    fear: clampCompanionMetric(sourceState?.fear, fallbackState.fear),
    respect: clampCompanionMetric(sourceState?.respect, fallbackState.respect),
    lastDialogueSummary: typeof sourceState?.lastDialogueSummary === "string" ? sourceState.lastDialogueSummary : undefined,
    dialogueHistory: normalizeDialogueHistory(sourceState?.dialogueHistory),
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
    primaryWeapon: "mainHand",
    secondaryWeapon: "offHand",
    shield: "offHand",
    body: "chest",
    torso: "chest",
    leftRing: "ring1",
    rightRing: "ring2",
  };
  const normalizedSlot = legacySlots[slot] ?? slot;
  const validSlots = new Set<EquipmentSlot>([
    "amulet",
    "back",
    "bag",
    "belt",
    "boots",
    "body",
    "chest",
    "cloak",
    "face",
    "gloves",
    "head",
    "mainHand",
    "neck",
    "offHand",
    "pants",
    "primaryWeapon",
    "rangedWeapon",
    "ring1",
    "ring2",
    "secondaryWeapon",
    "shield",
    "torso",
  ]);

  return validSlots.has(normalizedSlot as EquipmentSlot) ? (normalizedSlot as EquipmentSlot) : null;
}

function normalizeInventoryCategory(
  category: InventoryItem["category"] | string | undefined,
  fallbackCategory: InventoryItem["category"],
): InventoryItem["category"] {
  const legacyCategories: Record<string, InventoryItem["category"]> = {
    accessory: "accessory",
    books: "quest",
    clothing: "clothing",
    consumables: "consumable",
    documents: "document",
    keys: "misc",
    medicine: "medicine",
    materials: "material",
    shields: "shield",
    tools: "tool",
    weapons: "weapon",
  };
  const normalizedCategory = category ? legacyCategories[category] ?? category : fallbackCategory;
  const validCategories = new Set<InventoryItem["category"]>([
    "armor",
    "accessory",
    "clothing",
    "consumable",
    "document",
    "material",
    "medicine",
    "misc",
    "quest",
    "shield",
    "tool",
    "weapon",
  ]);

  return validCategories.has(normalizedCategory as InventoryItem["category"])
    ? (normalizedCategory as InventoryItem["category"])
    : fallbackCategory;
}

const weaponFallbackByTemplateId: Record<string, {
  weaponType: WeaponType;
  damageDice: string;
  damageType: DamageType;
  attackAttribute: AttackAttribute;
}> = {
  rusty_sword: {
    weaponType: "oneHandedSword",
    damageDice: "1d6",
    damageType: "slashing",
    attackAttribute: "strength",
  },
  wooden_club: {
    weaponType: "club",
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
  },
  rusty_axe: {
    weaponType: "axe",
    damageDice: "1d6",
    damageType: "slashing",
    attackAttribute: "strength",
  },
  old_dagger: {
    weaponType: "dagger",
    damageDice: "1d4",
    damageType: "piercing",
    attackAttribute: "dexterity",
  },
  unarmed: {
    weaponType: "unarmed",
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
  },
};

function normalizeDamageType(value: unknown, fallback: DamageType): DamageType {
  return value === "slashing" || value === "piercing" || value === "bludgeoning" ? value : fallback;
}

function normalizeAttackAttribute(value: unknown, fallback: AttackAttribute): AttackAttribute {
  return value === "strength" || value === "dexterity" ? value : fallback;
}

function normalizeInventoryItem(item: Partial<InventoryItem>, fallbackItem: InventoryItem): InventoryItem {
  const slot = item.slot || item.equipmentSlot ? normalizeEquipmentSlot((item.slot ?? item.equipmentSlot) as string) ?? undefined : undefined;
  const isQuestItem = Boolean(item.isQuestItem ?? item.questItem);
  const templateId = item.templateId || item.id || fallbackItem.templateId;
  const weaponFallback = weaponFallbackByTemplateId[templateId] ?? (
    fallbackItem.weaponType
      ? {
          weaponType: fallbackItem.weaponType,
          damageDice: fallbackItem.damageDice ?? "1d4",
          damageType: fallbackItem.damageType ?? "bludgeoning",
          attackAttribute: fallbackItem.attackAttribute ?? "strength",
        }
      : undefined
  );
  const shouldKeepWeaponFields = Boolean(weaponFallback || item.weaponType || fallbackItem.weaponType || item.category === "weapon" || fallbackItem.category === "weapon");

  return {
    ...fallbackItem,
    ...item,
    category: normalizeInventoryCategory(item.category, fallbackItem.category),
    createdAt: item.createdAt || fallbackItem.createdAt,
    equippable: Boolean(item.equippable ?? fallbackItem.equippable),
    canUse: Boolean(item.canUse ?? fallbackItem.canUse),
    canEquip: Boolean(item.canEquip ?? fallbackItem.canEquip ?? item.equippable ?? fallbackItem.equippable),
    icon: item.icon || fallbackItem.icon,
    iconUrl: item.iconUrl ?? fallbackItem.iconUrl,
    fallbackIconType: item.fallbackIconType ?? fallbackItem.fallbackIconType,
    id: item.id || fallbackItem.id,
    instanceId: item.instanceId ?? item.id ?? fallbackItem.instanceId ?? fallbackItem.id,
    itemId: item.itemId ?? item.templateId ?? fallbackItem.itemId ?? fallbackItem.templateId,
    isQuestItem,
    questItem: isQuestItem,
    quantity: Number.isFinite(item.quantity) ? Math.max(0, Number(item.quantity)) : fallbackItem.quantity,
    rarity: item.rarity ?? fallbackItem.rarity,
    slot,
    equipmentSlot: item.equipmentSlot ?? fallbackItem.equipmentSlot,
    stats: item.stats ?? item.bonuses ?? fallbackItem.stats,
    bonuses: item.bonuses ?? item.stats ?? fallbackItem.bonuses,
    templateId,
    value: Number.isFinite(item.value) ? Number(item.value) : fallbackItem.value,
    weight: Number.isFinite(item.weight) ? Math.max(0, Number(item.weight)) : fallbackItem.weight,
    armorValue: Number.isFinite(item.armorValue) ? Number(item.armorValue) : fallbackItem.armorValue,
    outfitStageOnEquip: item.outfitStageOnEquip ?? fallbackItem.outfitStageOnEquip,
    effectType: item.effectType ?? fallbackItem.effectType,
    effectValue: Number.isFinite(item.effectValue) ? Number(item.effectValue) : fallbackItem.effectValue,
    craftingMaterial: Boolean(item.craftingMaterial ?? fallbackItem.craftingMaterial),
    condition: item.condition ?? fallbackItem.condition ?? "intact",
    quality: item.quality ?? fallbackItem.quality ?? "common",
    origin: item.origin ?? fallbackItem.origin,
    owner: item.owner ?? fallbackItem.owner ?? "player",
    ...(shouldKeepWeaponFields
      ? {
          weaponType: isWeaponType(item.weaponType)
            ? item.weaponType
            : weaponFallback?.weaponType,
          damageDice: typeof item.damageDice === "string"
            ? item.damageDice
            : weaponFallback?.damageDice,
          damageType: normalizeDamageType(item.damageType, weaponFallback?.damageType ?? "bludgeoning"),
          attackAttribute: normalizeAttackAttribute(item.attackAttribute, weaponFallback?.attackAttribute ?? "strength"),
        }
      : {}),
  };
}

function createFallbackInventoryItem(item: Partial<InventoryItem>, index: number): InventoryItem {
  const templateId = item.templateId ?? item.itemId ?? item.id ?? `unknown_${index}`;
  const template = getItemTemplateById(templateId);
  const now = new Date(0).toISOString();

  if (template) {
    return {
      ...template,
      id: item.id ?? `${template.itemId}_${index}`,
      instanceId: item.instanceId ?? item.id ?? `${template.itemId}_${index}`,
      itemId: template.itemId,
      quantity: 1,
      condition: "intact",
      quality: template.defaultQuality ?? "common",
      origin: "migration",
      owner: "player",
      createdAt: now,
    };
  }

  return {
    id: String(item.id ?? templateId),
    instanceId: String(item.instanceId ?? item.id ?? templateId),
    itemId: String(item.itemId ?? templateId),
    templateId: String(templateId),
    nameKey: item.nameKey ?? "inventoryUnknownItem",
    descriptionKey: item.descriptionKey ?? "inventoryUnknownItem",
    category: "misc",
    rarity: "common",
    quantity: 1,
    weight: 0,
    value: 0,
    equippable: false,
    canUse: false,
    canEquip: false,
    icon: "unknown",
    fallbackIconType: "tool",
    condition: "intact",
    quality: "common",
    owner: "player",
    createdAt: now,
  };
}

function normalizeInventory(data: Partial<GameSave>): InventoryState {
  const fallbackInventory = createDefaultInventoryState();
  const sourceInventory = data.inventory;
  const sourceItems = Array.isArray(sourceInventory?.items) ? sourceInventory.items : fallbackInventory.items;
  const normalizedItems = sourceItems
    .map((item, index) => normalizeInventoryItem(item, fallbackInventory.items[index] ?? createFallbackInventoryItem(item, index)))
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

function normalizeMerchantTradeHistory(value: unknown): MerchantTradeMemory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((memory): memory is MerchantTradeMemory => {
      const candidate = memory as Partial<MerchantTradeMemory>;
      return (
        (candidate.type === "buy" ||
          candidate.type === "sell" ||
          candidate.type === "haggle" ||
          candidate.type === "refuse" ||
          candidate.type === "quest") &&
        typeof candidate.note === "string" &&
        typeof candidate.createdAt === "string"
      );
    })
    .map((memory) => ({
      id: memory.id || `merchant-memory-${memory.createdAt}`,
      type: memory.type,
      itemId: typeof memory.itemId === "string" ? memory.itemId : undefined,
      quantity: Number.isFinite(memory.quantity) ? Math.max(1, Number(memory.quantity)) : undefined,
      price: Number.isFinite(memory.price) ? Math.max(0, Number(memory.price)) : undefined,
      note: memory.note,
      createdAt: memory.createdAt,
    }))
    .slice(-30);
}

function normalizeMerchantDeal(value: unknown): MerchantDeal | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<MerchantDeal>;

  if (
    typeof source.id !== "string" ||
    (source.side !== "player_sells" && source.side !== "player_buys") ||
    typeof source.itemInstanceId !== "string" ||
    typeof source.itemId !== "string" ||
    (source.dealState !== "offered" && source.dealState !== "countered" && source.dealState !== "accepted")
  ) {
    return undefined;
  }

  return {
    id: source.id,
    side: source.side,
    itemInstanceId: source.itemInstanceId,
    itemId: source.itemId,
    quantity: Number.isFinite(source.quantity) ? Math.max(1, Number(source.quantity)) : 1,
    basePrice: Number.isFinite(source.basePrice) ? Math.max(1, Number(source.basePrice)) : 1,
    merchantOffer: Number.isFinite(source.merchantOffer) ? Math.max(1, Number(source.merchantOffer)) : 1,
    playerCounterOffer: Number.isFinite(source.playerCounterOffer) ? Math.max(1, Number(source.playerCounterOffer)) : undefined,
    dealState: source.dealState,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date(0).toISOString(),
  };
}

function normalizeMerchantState(merchantId: string, value: unknown): MerchantState {
  const source = (value ?? {}) as Partial<MerchantState>;
  const sourceItems = Array.isArray(source.items) ? source.items : [];

  return {
    merchantId: typeof source.merchantId === "string" ? source.merchantId : merchantId,
    gold: Number.isFinite(source.gold) ? Math.max(0, Math.floor(Number(source.gold))) : 0,
    items: sourceItems
      .map((item, index) => normalizeInventoryItem(item, createFallbackInventoryItem(item, index)))
      .filter((item) => item.quantity > 0),
    relationship: clampCompanionMetric(source.relationship, 0),
    trust: clampCompanionMetric(source.trust, 0),
    haggleCount: Number.isFinite(source.haggleCount) ? Math.max(0, Math.floor(Number(source.haggleCount))) : 0,
    tradeHistory: normalizeMerchantTradeHistory(source.tradeHistory),
    activeQuests: Array.isArray(source.activeQuests)
      ? source.activeQuests.filter((questId): questId is string => typeof questId === "string")
      : [],
    completedQuests: Array.isArray(source.completedQuests)
      ? source.completedQuests.filter((questId): questId is string => typeof questId === "string")
      : [],
    activeDeal: normalizeMerchantDeal(source.activeDeal),
  };
}

function normalizeMerchants(value: unknown): MerchantsState {
  if (!value || typeof value !== "object") {
    return { instances: {} };
  }

  const source = value as Partial<MerchantsState>;
  const rawInstances = source.instances && typeof source.instances === "object" && !Array.isArray(source.instances)
    ? source.instances as Record<string, unknown>
    : {};

  return {
    instances: Object.fromEntries(
      Object.entries(rawInstances).map(([merchantId, state]) => [merchantId, normalizeMerchantState(merchantId, state)]),
    ),
  };
}

function normalizeSave(data: GameSave) {
  const currentOutfitStage = normalizePlayerOutfitStage(data.player.currentOutfitStage);
  const unlockedOutfitStages = normalizeUnlockedOutfitStages(data.player.unlockedOutfitStages);
  const normalizedInventory = normalizeInventory(data);
  const normalizedPlayer = {
    ...data.player,
    currentOutfitStage,
    unlockedOutfitStages,
    portraitUrl:
      data.player.portraitUrl ||
      getFallbackPortraitUrl({
        ...data.player,
        currentOutfitStage,
        unlockedOutfitStages,
      }),
  };
  const normalizedPlayerWithProgression = normalizePlayerProgression(normalizedPlayer, normalizedInventory);
  const normalizedSave: GameSave = {
    ...data,
    currentLocationId: migrateLegacyWorldMapLocationId(data.currentLocationId),
    currentDay: Number.isFinite(data.currentDay) ? data.currentDay : DEFAULT_DAY,
    currentHour: Number.isFinite(data.currentHour) ? data.currentHour : DEFAULT_HOUR,
    companions: normalizeCompanions(data),
    inventory: normalizedInventory,
    npcs: normalizeNpcs(data.npcs),
    merchants: normalizeMerchants(data.merchants),
    cityAccess: normalizeCityAccess(data.cityAccess),
    cityState: normalizeCityState(data.cityState),
    navigationReturnContext: normalizeNavigationReturnContext(data.navigationReturnContext),
    travelEvents: normalizeTravelEvents(data.travelEvents),
    activeEvent: normalizeActiveEvent(data.activeEvent),
    travelEnergy: normalizeTravelEnergy(data),
    player: normalizedPlayerWithProgression,
  };
  const changed =
    normalizedSave.currentLocationId !== data.currentLocationId ||
    normalizedSave.currentDay !== data.currentDay ||
    normalizedSave.currentHour !== data.currentHour ||
    normalizedSave.travelEnergy?.currentEnergy !== data.travelEnergy?.currentEnergy ||
    normalizedSave.travelEnergy?.maxEnergy !== data.travelEnergy?.maxEnergy ||
    normalizedSave.travelEnergy?.lastRestDay !== data.travelEnergy?.lastRestDay ||
    JSON.stringify(normalizedSave.companions) !== JSON.stringify(data.companions) ||
    JSON.stringify(normalizedSave.inventory) !== JSON.stringify(data.inventory) ||
    JSON.stringify(normalizedSave.npcs) !== JSON.stringify(data.npcs) ||
    JSON.stringify(normalizedSave.merchants) !== JSON.stringify(data.merchants) ||
    JSON.stringify(normalizedSave.cityAccess) !== JSON.stringify(data.cityAccess) ||
    JSON.stringify(normalizedSave.cityState) !== JSON.stringify(data.cityState) ||
    JSON.stringify(normalizedSave.navigationReturnContext) !== JSON.stringify(data.navigationReturnContext) ||
    JSON.stringify(normalizedSave.travelEvents) !== JSON.stringify(data.travelEvents) ||
    JSON.stringify(normalizedSave.activeEvent) !== JSON.stringify(data.activeEvent ?? null) ||
    normalizedSave.player.currentOutfitStage !== data.player.currentOutfitStage ||
    JSON.stringify(normalizedSave.player.unlockedOutfitStages) !==
      JSON.stringify(data.player.unlockedOutfitStages) ||
    normalizedSave.player.portraitUrl !== data.player.portraitUrl ||
    JSON.stringify(normalizedSave.player.combat) !== JSON.stringify(data.player.combat) ||
    JSON.stringify(normalizedSave.player.training) !== JSON.stringify(data.player.training);

  return { save: normalizedSave, changed };
}

export function saveGame(data: GameSave) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data).save));
}

function clampGoldAmount(amount: number, maxAmount: number) {
  return Math.min(maxAmount, Math.max(1, Math.floor(amount)));
}

export function getPlayerGold(save?: GameSave | null) {
  const gold = save?.inventory?.gold;

  return Number.isFinite(gold) ? Math.max(0, Math.floor(Number(gold))) : 0;
}

export function addPlayerGold(save: GameSave, amount: number, reason = "unknown"): GameSave {
  const safeAmount = clampGoldAmount(amount, 999);
  const inventory = save.inventory ?? createDefaultInventoryState();
  const nextGold = getPlayerGold(save) + safeAmount;

  console.info("[Gold] added", { amount: safeAmount, reason, gold: nextGold });

  return {
    ...save,
    inventory: {
      ...inventory,
      gold: nextGold,
    },
  };
}

export function spendPlayerGold(save: GameSave, amount: number, reason = "unknown") {
  const safeAmount = clampGoldAmount(amount, 999);
  const currentGold = getPlayerGold(save);

  if (currentGold < safeAmount) {
    return { save, success: false };
  }

  console.info("[Gold] spent", { amount: safeAmount, reason, gold: currentGold - safeAmount });

  return {
    save: {
      ...save,
      inventory: {
        ...(save.inventory ?? createDefaultInventoryState()),
        gold: currentGold - safeAmount,
      },
    },
    success: true,
  };
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
