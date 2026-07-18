import type { PlayerCharacter, PlayerLifeState, PlayerOutfitStage } from "../../types/player";
import {
  WORLD_MAP_START_NODE_ID,
  isWorldMapNodeId,
  type WorldMapNodeId,
} from "../../data/worldMap";
import { getPlayerPortraitUrlForOutfit } from "../../data/playerVisuals";
import {
  BASE_ATTRIBUTES,
  RACIAL_STATS_SCHEMA_VERSION,
  calculateFinalAttributes,
  getRaceDefinition,
  inferAllocatedAttributes,
} from "../../data/raceDefinitions";
import { ROYAL_COURT_NPC_IDS, getRoyalCourtNpcById } from "../../data/royalCourtNpcs";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import { getItemTemplateById } from "../../data/itemRegistry";
import type { CityAccessRecord, CityAccessState, CityId, CityState, NavigationReturnContext } from "../../types/city";
import type { CompanionDialogueMessage } from "../../types/companion";
import type { AttackAttribute, CombatState, CombatStats, CombatantLifeState, CombatantState, DamageType, PostCombatPhase, WeaponType } from "../../types/combat";
import type { ActiveEventContext } from "../../types/events";
import type { EquipmentSlot, InventoryItem, InventoryState, ReadableContentType } from "../../types/inventory";
import type { MerchantDeal, MerchantState, MerchantTradeMemory, MerchantsState } from "../../types/merchant";
import type { NpcInstance, NpcRole, NpcRuntimeState, NpcStatus } from "../../types/npc";
import { isWeaponType } from "../combat/combatValidation";
import { normalizeNpcCombatState } from "../combat/combatSystem";
import { createDefaultPlayerTextCombatState } from "../combat/text/combatStamina";
import { normalizePlayerRangedCombatState } from "../combat/ranged/rangedWeaponState";
import type {
  CombatDistance,
  CombatInjury,
  CombatStance,
  CombatTechniqueId,
  NpcTextCombatState,
  PlayerTextCombatState,
} from "../combat/text/combatTextTypes";
import { createDefaultMagicState } from "../magic/magicProgression";
import { getMagicWordById } from "../magic/magicWords";
import { getSpellDefinitionById } from "../magic/spellDefinitions";
import {
  applyResourceRegeneration,
  getGameMinute,
  normalizeResourceRegenerationState,
  type ResourceRegenerationOptions,
  type ResourceRegenerationState,
} from "../resources/resourceRegeneration";
import { normalizeTrainerProgression } from "../trainers/trainerSystem";
import { normalizeSmithingProgression } from "../smithing/smithingSystem";
import type {
  ActiveMagicEffect,
  CustomSpellFormula,
  KnownMagicWord,
  KnownSpellFormula,
  MagicMasteryLevel,
  PlayerMagicState,
} from "../magic/magicTypes";
import { normalizePlayerProgression } from "../player/playerProgressionSystem";
import { getPlayerCarryCapacity } from "../player/effectivePlayerStats";

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

export type SwampState = {
  currentLocationId?: string;
  discoveredLocationIds: string[];
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
  swampState?: SwampState;
  contextGuides?: {
    readGuideIds: string[];
  };
  navigationReturnContext?: NavigationReturnContext;
  travelEvents?: TravelEventsState;
  activeEvent?: ActiveEventContext | null;
  activeCombat?: CombatState | null;
  resourceRegeneration?: ResourceRegenerationState;
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
    value === "blacksmith" ||
    value === "trainer"
  );
}

function isNpcStatus(value: unknown): value is NpcStatus {
  return (
    value === "alive" ||
    value === "defeated" ||
    value === "unconscious" ||
    value === "surrendered" ||
    value === "dead" ||
    value === "escaped" ||
    value === "gone" ||
    value === "missing" ||
    value === "imprisoned" ||
    value === "exiled"
  );
}

function isCombatantLifeState(value: unknown): value is CombatantLifeState {
  return (
    value === "active" ||
    value === "wounded" ||
    value === "incapacitated" ||
    value === "unconscious" ||
    value === "surrendered" ||
    value === "defeated" ||
    value === "dead"
  );
}

function isCombatStance(value: unknown): value is CombatStance {
  return value === "balanced" || value === "aggressive" || value === "defensive" || value === "guardHigh" || value === "guardLow" || value === "mobile";
}

function isCombatDistance(value: unknown): value is CombatDistance {
  return value === "grapple" || value === "veryClose" || value === "melee" || value === "reach" || value === "medium";
}

function isCombatTechniqueId(value: unknown): value is CombatTechniqueId {
  return value === "basicSlash" || value === "aimedThrust" || value === "powerChop" || value === "shieldBash" || value === "quickParry" || value === "riposte" || value === "disarmBind" || value === "legSweep";
}

function normalizeCombatInjuries(value: unknown): CombatInjury[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): CombatInjury | null => {
      const source = entry as Partial<CombatInjury>;

      if (typeof source.id !== "string" || typeof source.type !== "string") {
        return null;
      }

      return {
        id: source.id,
        type: source.type as CombatInjury["type"],
        zone: source.zone,
        severity: source.severity === "moderate" || source.severity === "severe" ? source.severity : "minor",
        remainingTurns: Number.isFinite(source.remainingTurns) ? Math.max(0, Math.floor(Number(source.remainingTurns))) : undefined,
        persistent: Boolean(source.persistent),
        source: typeof source.source === "string" ? source.source : undefined,
      };
    })
    .filter((entry): entry is CombatInjury => entry !== null)
    .slice(-12);
}

function normalizePlayerTextCombatState(player: PlayerCharacter): PlayerTextCombatState {
  const fallback = createDefaultPlayerTextCombatState(player.derivedStats?.stamina ?? 10);
  const source = (player.textCombat ?? {}) as Partial<PlayerTextCombatState>;
  const maxStamina = Number.isFinite(source.maxStamina) ? Math.max(1, Math.floor(Number(source.maxStamina))) : fallback.maxStamina;

  return {
    maxStamina,
    stamina: Number.isFinite(source.stamina) ? Math.min(maxStamina, Math.max(0, Math.floor(Number(source.stamina)))) : fallback.stamina,
    stance: isCombatStance(source.stance) ? source.stance : fallback.stance,
    distance: isCombatDistance(source.distance) ? source.distance : fallback.distance,
    balance: Number.isFinite(source.balance) ? Math.max(-5, Math.min(5, Math.floor(Number(source.balance)))) : fallback.balance,
    knownTechniques: Array.isArray(source.knownTechniques)
      ? Array.from(new Set(source.knownTechniques.filter(isCombatTechniqueId)))
      : fallback.knownTechniques,
    injuries: normalizeCombatInjuries(source.injuries),
    detailedRolls: Boolean(source.detailedRolls),
    ranged: normalizePlayerRangedCombatState(source.ranged),
  };
}

function normalizeNpcTextCombatState(value: unknown): NpcTextCombatState {
  const source = (value ?? {}) as Partial<NpcTextCombatState>;

  return {
    stance: isCombatStance(source.stance) ? source.stance : "balanced",
    distance: isCombatDistance(source.distance) ? source.distance : "melee",
    balance: Number.isFinite(source.balance) ? Math.max(-5, Math.min(5, Math.floor(Number(source.balance)))) : 0,
    injuries: normalizeCombatInjuries(source.injuries),
    telegraphedAction: source.telegraphedAction,
  };
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
  const textCombat = source.textCombat ? normalizeNpcTextCombatState(source.textCombat) : undefined;
  const status = isNpcStatus(source.status) ? source.status : "alive";
  const isDefeatedStatus = status === "dead" || status === "defeated" || status === "unconscious" || status === "surrendered";
  const lifeState: CombatantLifeState =
    status === "dead"
      ? "dead"
      : status === "surrendered"
        ? "surrendered"
        : status === "unconscious"
          ? "unconscious"
          : status === "defeated"
            ? "defeated"
            : combat?.lifeState ?? "active";
  const rawLoot = source.loot && typeof source.loot === "object" ? source.loot as NonNullable<NpcInstance["loot"]> : undefined;
  const loot = rawLoot
    ? {
        generated: Boolean(rawLoot.generated),
        searched: Boolean(rawLoot.searched),
        items: Array.isArray(rawLoot.items)
          ? rawLoot.items.map((item, index) => normalizeInventoryItem(item, createFallbackInventoryItem(item, index)))
          : [],
        gold: Number.isFinite(rawLoot.gold) ? Math.max(0, Math.floor(Number(rawLoot.gold))) : 0,
        generatedAt: typeof rawLoot.generatedAt === "string" ? rawLoot.generatedAt : undefined,
      }
    : undefined;

  return {
    npcId: instanceId,
    instanceId,
    templateId,
    role,
    status,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date(0).toISOString(),
    createdDuringEventId: typeof source.createdDuringEventId === "string" ? source.createdDuringEventId : undefined,
    createdOnRoute,
    met: Boolean(source.met),
    relationship: clampCompanionMetric(source.relationship, 0),
    trust: clampCompanionMetric(source.trust, 0),
    fear: clampCompanionMetric(source.fear, 0),
    hostility: clampCompanionMetric(source.hostility, 0),
    dialogueHistory: normalizeNpcDialogueHistory(source.dialogueHistory),
    learnedKnowledge: source.learnedKnowledge,
    postCombatMemory: source.postCombatMemory,
    loot,
    combat: combat
      ? {
          ...combat,
          currentHealth: isDefeatedStatus ? 0 : combat.currentHealth,
          isDefeated: isDefeatedStatus || combat.isDefeated,
          lifeState,
        }
      : undefined,
    textCombat,
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
    textCombat: normalizeNpcTextCombatState(undefined),
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
    returnTo: source.returnTo === "cityMap" || source.returnTo === "swampMap" ? source.returnTo : "worldMap",
    cityId: typeof source.cityId === "string" ? source.cityId : undefined,
    cityLocationId: typeof source.cityLocationId === "string" ? source.cityLocationId : undefined,
    swampLocationId: typeof source.swampLocationId === "string" ? source.swampLocationId : undefined,
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
      "central_training_yard",
      "central_archery_range",
      "central_mage_hut",
      ...discoveredLocationIds,
    ])),
  };
}

function normalizeSwampState(value: unknown): SwampState {
  const source = (value ?? {}) as Partial<SwampState>;
  const discoveredLocationIds = Array.isArray(source.discoveredLocationIds)
    ? source.discoveredLocationIds.filter((locationId): locationId is string => typeof locationId === "string")
    : [];

  return {
    currentLocationId: typeof source.currentLocationId === "string" ? source.currentLocationId : "swamp_entrance",
    discoveredLocationIds: Array.from(new Set(["swamp_entrance", ...discoveredLocationIds])),
  };
}

function normalizeNavigationReturnContext(value: unknown): NavigationReturnContext | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<NavigationReturnContext>;

  if (
    source.screen !== "eventScene" &&
    source.screen !== "merchantScene" &&
    source.screen !== "cityMap" &&
    source.screen !== "swampMap"
  ) {
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

function normalizeContextGuides(value: unknown): GameSave["contextGuides"] {
  const source = value && typeof value === "object" ? value as { readGuideIds?: unknown } : {};

  return {
    readGuideIds: Array.isArray(source.readGuideIds)
      ? Array.from(new Set(source.readGuideIds.filter((guideId): guideId is string => typeof guideId === "string")))
      : [],
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
  iron_sword: {
    weaponType: "oneHandedSword",
    damageDice: "1d6",
    damageType: "slashing",
    attackAttribute: "strength",
  },
  steel_sword: {
    weaponType: "oneHandedSword",
    damageDice: "1d8",
    damageType: "slashing",
    attackAttribute: "strength",
  },
  spear: {
    weaponType: "spear",
    damageDice: "1d6",
    damageType: "piercing",
    attackAttribute: "strength",
  },
  simple_bow: {
    weaponType: "bow",
    damageDice: "1d6",
    damageType: "piercing",
    attackAttribute: "dexterity",
  },
  light_crossbow: {
    weaponType: "lightCrossbow",
    damageDice: "1d8",
    damageType: "piercing",
    attackAttribute: "dexterity",
  },
  wooden_club: {
    weaponType: "club",
    damageDice: "1d4",
    damageType: "bludgeoning",
    attackAttribute: "strength",
  },
  iron_mace: {
    weaponType: "mace",
    damageDice: "1d6",
    damageType: "bludgeoning",
    attackAttribute: "strength",
  },
  steel_mace: {
    weaponType: "mace",
    damageDice: "1d8",
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
  return (
    value === "slashing" ||
    value === "piercing" ||
    value === "bludgeoning" ||
    value === "fire" ||
    value === "cold" ||
    value === "lightning" ||
    value === "force" ||
    value === "radiant" ||
    value === "necrotic" ||
    value === "poison" ||
    value === "psychic"
  )
    ? value
    : fallback;
}

function normalizeMagicMasteryLevel(value: unknown, fallback: MagicMasteryLevel): MagicMasteryLevel {
  return value === "heard" || value === "understood" || value === "mastered" || value === "comprehended"
    ? value
    : fallback;
}

function normalizeKnownMagicWords(value: unknown, fallback: KnownMagicWord[]): KnownMagicWord[] {
  const source = Array.isArray(value) ? value : fallback;
  const normalized = source
    .map((entry) => {
      const candidate = entry as Partial<KnownMagicWord>;

      if (typeof candidate.wordId !== "string" || !getMagicWordById(candidate.wordId)) {
        return null;
      }

      return {
        wordId: candidate.wordId,
        masteryLevel: normalizeMagicMasteryLevel(candidate.masteryLevel, "heard"),
        discoveredAt: typeof candidate.discoveredAt === "string" ? candidate.discoveredAt : new Date(0).toISOString(),
        learnedFrom: typeof candidate.learnedFrom === "string" ? candidate.learnedFrom : "migration",
        usageCount: Number.isFinite(candidate.usageCount) ? Math.max(0, Math.floor(Number(candidate.usageCount))) : 0,
        successfulCastCount: Number.isFinite(candidate.successfulCastCount) ? Math.max(0, Math.floor(Number(candidate.successfulCastCount))) : 0,
        failedCastCount: Number.isFinite(candidate.failedCastCount) ? Math.max(0, Math.floor(Number(candidate.failedCastCount))) : 0,
        experience: Number.isFinite(candidate.experience) ? Math.max(0, Math.floor(Number(candidate.experience))) : 0,
        isFavorite: Boolean(candidate.isFavorite),
      } satisfies KnownMagicWord;
    })
    .filter((entry): entry is KnownMagicWord => Boolean(entry));

  const byWordId = new Map<string, KnownMagicWord>();

  for (const word of normalized) {
    byWordId.set(word.wordId, word);
  }

  return Array.from(byWordId.values());
}

function normalizeKnownSpellFormulas(value: unknown, fallback: KnownSpellFormula[]): KnownSpellFormula[] {
  const source = Array.isArray(value) ? value : fallback;

  return source
    .map((entry) => {
      const candidate = entry as Partial<KnownSpellFormula>;

      if (typeof candidate.spellId !== "string") {
        return null;
      }

      const spell = getSpellDefinitionById(candidate.spellId);

      if (!spell) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" ? candidate.id : `formula_${spell.id}`,
        spellId: spell.id,
        wordIds: Array.isArray(candidate.wordIds)
          ? candidate.wordIds.filter((wordId): wordId is string => typeof wordId === "string" && Boolean(getMagicWordById(wordId)))
          : [...spell.requiredWordIds],
        discoveredAt: typeof candidate.discoveredAt === "string" ? candidate.discoveredAt : new Date(0).toISOString(),
        learnedFrom: typeof candidate.learnedFrom === "string" ? candidate.learnedFrom : "migration",
        successfulCastCount: Number.isFinite(candidate.successfulCastCount) ? Math.max(0, Math.floor(Number(candidate.successfulCastCount))) : 0,
        failedCastCount: Number.isFinite(candidate.failedCastCount) ? Math.max(0, Math.floor(Number(candidate.failedCastCount))) : 0,
        isFavorite: Boolean(candidate.isFavorite),
      } satisfies KnownSpellFormula;
    })
    .filter((entry): entry is KnownSpellFormula => Boolean(entry));
}

function normalizeCustomSpellFormulas(value: unknown): CustomSpellFormula[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const candidate = entry as Partial<CustomSpellFormula>;
      const wordIds = Array.isArray(candidate.wordIds)
        ? candidate.wordIds.filter((wordId): wordId is string => typeof wordId === "string" && Boolean(getMagicWordById(wordId)))
        : [];

      if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || wordIds.length === 0) {
        return null;
      }

      return {
        id: candidate.id,
        name: candidate.name.slice(0, 80),
        wordIds,
        createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date(0).toISOString(),
        usageCount: Number.isFinite(candidate.usageCount) ? Math.max(0, Math.floor(Number(candidate.usageCount))) : 0,
      } satisfies CustomSpellFormula;
    })
    .filter((entry): entry is CustomSpellFormula => Boolean(entry));
}

function normalizeActiveMagicEffects(value: unknown): ActiveMagicEffect[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): ActiveMagicEffect | null => {
      const candidate = entry as Partial<ActiveMagicEffect>;
      const effectType = candidate.effectType;

      if (
        typeof candidate.id !== "string" ||
        (
          effectType !== "silence" &&
          effectType !== "light" &&
          effectType !== "burning" &&
          effectType !== "ward" &&
          effectType !== "slowed" &&
          effectType !== "hastened"
        )
      ) {
        return null;
      }

      return {
        id: candidate.id,
        effectType,
        sourceSpellId: typeof candidate.sourceSpellId === "string" ? candidate.sourceSpellId : undefined,
        remainingTurns: Number.isFinite(candidate.remainingTurns) ? Math.max(0, Math.floor(Number(candidate.remainingTurns))) : 0,
      };
    })
    .filter((entry): entry is ActiveMagicEffect => entry !== null && entry.remainingTurns > 0);
}

function normalizeMagicCooldowns(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

  return Object.fromEntries(
    Object.entries(source)
      .filter(([spellId, turns]) => Boolean(getSpellDefinitionById(spellId)) && Number.isFinite(turns))
      .map(([spellId, turns]) => [spellId, Math.max(0, Math.floor(Number(turns)))]),
  );
}

function normalizePlayerMagicState(player: PlayerCharacter): PlayerMagicState {
  const fallback = createDefaultMagicState(player.characterClass);
  const source = (player.magic ?? {}) as Partial<PlayerMagicState>;
  const maxMana = Number.isFinite(source.maxMana) ? Math.max(0, Math.floor(Number(source.maxMana))) : fallback.maxMana;

  return {
    canUseMagic: Boolean(source.canUseMagic ?? fallback.canUseMagic),
    mana: Number.isFinite(source.mana) ? Math.min(maxMana, Math.max(0, Math.floor(Number(source.mana)))) : fallback.mana,
    maxMana,
    manaRegeneration: Number.isFinite(source.manaRegeneration) ? Math.max(0, Math.floor(Number(source.manaRegeneration))) : fallback.manaRegeneration,
    magicLevel: Number.isFinite(source.magicLevel) ? Math.max(0, Math.floor(Number(source.magicLevel))) : fallback.magicLevel,
    magicExperience: Number.isFinite(source.magicExperience) ? Math.max(0, Math.floor(Number(source.magicExperience))) : fallback.magicExperience,
    knownWords: normalizeKnownMagicWords(source.knownWords, fallback.knownWords),
    knownSpellFormulas: normalizeKnownSpellFormulas(source.knownSpellFormulas, fallback.knownSpellFormulas),
    customSpellFormulas: normalizeCustomSpellFormulas(source.customSpellFormulas),
    activeEffects: normalizeActiveMagicEffects(source.activeEffects),
    cooldowns: normalizeMagicCooldowns(source.cooldowns),
    corruption: Number.isFinite(source.corruption) ? Math.max(0, Math.floor(Number(source.corruption))) : fallback.corruption,
    instability: Number.isFinite(source.instability) ? Math.max(0, Math.floor(Number(source.instability))) : fallback.instability,
    preferredSchool: source.preferredSchool ?? fallback.preferredSchool,
    equippedFocusId: typeof source.equippedFocusId === "string" ? source.equippedFocusId : fallback.equippedFocusId,
    grimoireUnlocked: Boolean(source.grimoireUnlocked ?? fallback.grimoireUnlocked),
  };
}

function normalizeAttackAttribute(value: unknown, fallback: AttackAttribute): AttackAttribute {
  return value === "strength" || value === "dexterity" ? value : fallback;
}

function normalizeReadableContentType(value: unknown, fallback?: ReadableContentType): ReadableContentType | undefined {
  return value === "image" || value === "text" || value === "pages" ? value : fallback;
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
    readable: Boolean(item.readable ?? fallbackItem.readable),
    readContentType: normalizeReadableContentType(item.readContentType, fallbackItem.readContentType),
    readAssetId: typeof item.readAssetId === "string" ? item.readAssetId : fallbackItem.readAssetId,
    readTitleKey: typeof item.readTitleKey === "string" ? item.readTitleKey : fallbackItem.readTitleKey,
    readDescriptionKey: typeof item.readDescriptionKey === "string" ? item.readDescriptionKey : fallbackItem.readDescriptionKey,
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
    (
      source.dealState !== "offered" &&
      source.dealState !== "countered" &&
      source.dealState !== "accepted" &&
      source.dealState !== "negotiation_closed"
    )
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

function isCombatPhase(value: unknown): value is CombatState["phase"] {
  return (
    value === "starting" ||
    value === "awaitingPlayerAction" ||
    value === "resolvingPlayerAction" ||
    value === "resolvingEnemyTurns" ||
    value === "roundEnd" ||
    value === "victory" ||
    value === "defeat" ||
    value === "finished"
  );
}

function isPostCombatPhase(value: unknown): value is PostCombatPhase {
  return (
    value === "none" ||
    value === "playerDefeated" ||
    value === "npcDefeatedAlive" ||
    value === "enemyDead" ||
    value === "monsterDefeated" ||
    value === "loot" ||
    value === "dialogue" ||
    value === "exit"
  );
}

function normalizeCombatantState(id: string, value: unknown): CombatantState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<CombatantState>;
  const side = source.side === "player" || source.side === "ally" || source.side === "enemy" ? source.side : null;
  const entityType = source.entityType === "player" || source.entityType === "npc" || source.entityType === "monster" ? source.entityType : null;

  if (!side || !entityType) {
    return null;
  }

  const maxHp = Math.max(1, Number.isFinite(source.maxHp) ? Number(source.maxHp) : 1);
  const currentHp = Math.min(maxHp, Math.max(0, Number.isFinite(source.currentHp) ? Number(source.currentHp) : maxHp));
  const alive = currentHp > 0 && source.alive !== false;
  const conscious = alive && source.conscious !== false;
  const lifeState = isCombatantLifeState(source.lifeState)
    ? source.lifeState
    : currentHp <= 0
      ? entityType === "monster"
        ? "dead"
        : "defeated"
      : "active";

  return {
    id,
    side,
    entityType,
    templateId: typeof source.templateId === "string" ? source.templateId : undefined,
    instanceId: typeof source.instanceId === "string" ? source.instanceId : undefined,
    currentHp,
    maxHp,
    currentMana: Math.max(0, Number.isFinite(source.currentMana) ? Number(source.currentMana) : 0),
    maxMana: Math.max(0, Number.isFinite(source.maxMana) ? Number(source.maxMana) : 0),
    currentStamina: Math.max(0, Number.isFinite(source.currentStamina) ? Number(source.currentStamina) : 0),
    maxStamina: Math.max(0, Number.isFinite(source.maxStamina) ? Number(source.maxStamina) : 0),
    armorClass: Math.max(1, Number.isFinite(source.armorClass) ? Number(source.armorClass) : 10),
    initiative: Number.isFinite(source.initiative) ? Number(source.initiative) : 0,
    dexterityModifier: Number.isFinite(source.dexterityModifier) ? Number(source.dexterityModifier) : 0,
    alive,
    conscious,
    canAct: alive && conscious && source.canAct !== false,
    lifeState,
    position: typeof source.position === "string" ? source.position : undefined,
    distance: typeof source.distance === "string" ? source.distance : undefined,
    cover: typeof source.cover === "string" ? source.cover : undefined,
    statuses: Array.isArray(source.statuses) ? source.statuses.filter((status) => status && typeof status.id === "string") : [],
  };
}

function isCombatActionType(value: unknown): value is CombatState["log"][number]["actionType"] {
  return value === "meleeAttack" || value === "rangedAttack" || value === "magic" || value === "defend" || value === "move" || value === "reload" || value === "useItem" || value === "flee" || value === "wait";
}

function isCombatActionOutcome(value: unknown): value is CombatState["log"][number]["outcome"] {
  return value === "success" || value === "miss" || value === "dodge" || value === "block" || value === "parry" || value === "criticalSuccess" || value === "criticalFailure" || value === "invalid";
}

function normalizeActiveCombat(value: unknown): CombatState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<CombatState>;
  const rawCombatants = source.combatants && typeof source.combatants === "object" && !Array.isArray(source.combatants)
    ? source.combatants as Record<string, unknown>
    : {};
  const combatants = Object.fromEntries(
    Object.entries(rawCombatants)
      .map(([id, combatant]) => [id, normalizeCombatantState(id, combatant)] as const)
      .filter((entry): entry is [string, CombatantState] => entry[1] !== null),
  );
  const turnOrder = Array.isArray(source.turnOrder)
    ? source.turnOrder.filter((id): id is string => typeof id === "string" && Boolean(combatants[id]))
    : Object.keys(combatants);

  if (turnOrder.length === 0) {
    return null;
  }

  const currentTurnIndex = Math.min(turnOrder.length - 1, Math.max(0, Number.isFinite(source.currentTurnIndex) ? Number(source.currentTurnIndex) : 0));

  return {
    combatId: typeof source.combatId === "string" ? source.combatId : `combat_${Date.now()}`,
    phase: isCombatPhase(source.phase) ? source.phase : "awaitingPlayerAction",
    round: Math.max(1, Number.isFinite(source.round) ? Number(source.round) : 1),
    turnOrder,
    currentTurnIndex,
    activeCombatantId: typeof source.activeCombatantId === "string" && combatants[source.activeCombatantId] ? source.activeCombatantId : turnOrder[currentTurnIndex],
    combatants,
    appliedActionIds: Array.isArray(source.appliedActionIds) ? source.appliedActionIds.filter((id): id is string => typeof id === "string").slice(-100) : [],
    log: Array.isArray(source.log)
      ? source.log
          .filter((entry) => entry && typeof entry.id === "string" && typeof entry.actorId === "string")
          .map((entry) => ({
            id: entry.id,
            round: Math.max(1, Number.isFinite(entry.round) ? Number(entry.round) : 1),
            actorId: entry.actorId,
            targetId: typeof entry.targetId === "string" ? entry.targetId : undefined,
            actionType: isCombatActionType(entry.actionType) ? entry.actionType : "wait",
            outcome: isCombatActionOutcome(entry.outcome) ? entry.outcome : "invalid",
            createdAt: Number.isFinite(entry.createdAt) ? Number(entry.createdAt) : Date.now(),
            debug: entry.debug && typeof entry.debug === "object" ? entry.debug as Record<string, unknown> : undefined,
          }))
          .slice(-100)
      : [],
    startedAt: Number.isFinite(source.startedAt) ? Number(source.startedAt) : Date.now(),
    finishedAt: Number.isFinite(source.finishedAt) ? Number(source.finishedAt) : undefined,
    postCombatPhase: isPostCombatPhase(source.postCombatPhase) ? source.postCombatPhase : undefined,
    defeatedCombatantIds: Array.isArray(source.defeatedCombatantIds)
      ? source.defeatedCombatantIds.filter((id): id is string => typeof id === "string")
      : undefined,
  };
}

function normalizeSave(data: GameSave, resourceOptions?: ResourceRegenerationOptions) {
  const currentOutfitStage = normalizePlayerOutfitStage(data.player.currentOutfitStage);
  const unlockedOutfitStages = normalizeUnlockedOutfitStages(data.player.unlockedOutfitStages);
  const normalizedInventory = normalizeInventory(data);
  const storedCombatHealth = Number((data.player.combat as Partial<CombatStats> | undefined)?.currentHealth);
  const storedLifeState: PlayerLifeState | undefined =
    data.player.lifeState === "dead" || (Number.isFinite(storedCombatHealth) && storedCombatHealth <= 0)
      ? "dead"
      : data.player.lifeState;
  const raceDefinition = getRaceDefinition(data.player.race);
  const baseAttributes = data.player.baseAttributes ?? BASE_ATTRIBUTES;
  const allocatedAttributes = data.player.allocatedAttributes ?? inferAllocatedAttributes(data.player.attributes, data.player.race);
  const attributes = calculateFinalAttributes(baseAttributes, allocatedAttributes, data.player.race);
  const normalizedPlayer = {
    ...data.player,
    lifeState: storedLifeState,
    currentOutfitStage,
    unlockedOutfitStages,
    baseAttributes,
    allocatedAttributes,
    racialModifiers: raceDefinition.statModifiers,
    statsSchemaVersion: RACIAL_STATS_SCHEMA_VERSION,
    attributes,
    magic: normalizePlayerMagicState(data.player),
    textCombat: normalizePlayerTextCombatState(data.player),
    trainerProgression: normalizeTrainerProgression(data.player.trainerProgression),
    smithing: normalizeSmithingProgression(data.player.smithing),
    portraitUrl: getPlayerPortraitUrlForOutfit({
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
    inventory: {
      ...normalizedInventory,
      maxCarryWeight: getPlayerCarryCapacity(normalizedPlayerWithProgression, normalizedInventory),
    },
    npcs: normalizeNpcs(data.npcs),
    merchants: normalizeMerchants(data.merchants),
    cityAccess: normalizeCityAccess(data.cityAccess),
    cityState: normalizeCityState(data.cityState),
    swampState: normalizeSwampState(data.swampState),
    contextGuides: normalizeContextGuides(data.contextGuides),
    navigationReturnContext: normalizeNavigationReturnContext(data.navigationReturnContext),
    travelEvents: normalizeTravelEvents(data.travelEvents),
    activeEvent: normalizeActiveEvent(data.activeEvent),
    activeCombat: normalizeActiveCombat(data.activeCombat),
    travelEnergy: normalizeTravelEnergy(data),
    resourceRegeneration: normalizeResourceRegenerationState(data.resourceRegeneration, getGameMinute(data)),
    player: normalizedPlayerWithProgression,
  };
  const regeneratedSave = applyResourceRegeneration(normalizedSave, resourceOptions);
  const changed =
    regeneratedSave.currentLocationId !== data.currentLocationId ||
    regeneratedSave.currentDay !== data.currentDay ||
    regeneratedSave.currentHour !== data.currentHour ||
    regeneratedSave.travelEnergy?.currentEnergy !== data.travelEnergy?.currentEnergy ||
    regeneratedSave.travelEnergy?.maxEnergy !== data.travelEnergy?.maxEnergy ||
    regeneratedSave.travelEnergy?.lastRestDay !== data.travelEnergy?.lastRestDay ||
    JSON.stringify(regeneratedSave.companions) !== JSON.stringify(data.companions) ||
    JSON.stringify(regeneratedSave.inventory) !== JSON.stringify(data.inventory) ||
    JSON.stringify(regeneratedSave.npcs) !== JSON.stringify(data.npcs) ||
    JSON.stringify(regeneratedSave.merchants) !== JSON.stringify(data.merchants) ||
    JSON.stringify(regeneratedSave.cityAccess) !== JSON.stringify(data.cityAccess) ||
    JSON.stringify(regeneratedSave.cityState) !== JSON.stringify(data.cityState) ||
    JSON.stringify(regeneratedSave.swampState) !== JSON.stringify(data.swampState) ||
    JSON.stringify(regeneratedSave.navigationReturnContext) !== JSON.stringify(data.navigationReturnContext) ||
    JSON.stringify(regeneratedSave.travelEvents) !== JSON.stringify(data.travelEvents) ||
    JSON.stringify(regeneratedSave.activeEvent) !== JSON.stringify(data.activeEvent ?? null) ||
    JSON.stringify(regeneratedSave.activeCombat) !== JSON.stringify(data.activeCombat ?? null) ||
    JSON.stringify(regeneratedSave.resourceRegeneration) !== JSON.stringify(data.resourceRegeneration) ||
    regeneratedSave.player.currentOutfitStage !== data.player.currentOutfitStage ||
    JSON.stringify(regeneratedSave.player.unlockedOutfitStages) !==
      JSON.stringify(data.player.unlockedOutfitStages) ||
    regeneratedSave.player.portraitUrl !== data.player.portraitUrl ||
    JSON.stringify(regeneratedSave.player.baseAttributes) !== JSON.stringify(data.player.baseAttributes) ||
    JSON.stringify(regeneratedSave.player.allocatedAttributes) !== JSON.stringify(data.player.allocatedAttributes) ||
    JSON.stringify(regeneratedSave.player.racialModifiers) !== JSON.stringify(data.player.racialModifiers) ||
    regeneratedSave.player.statsSchemaVersion !== data.player.statsSchemaVersion ||
    JSON.stringify(regeneratedSave.player.attributes) !== JSON.stringify(data.player.attributes) ||
    JSON.stringify(regeneratedSave.player.combat) !== JSON.stringify(data.player.combat) ||
    JSON.stringify(regeneratedSave.player.training) !== JSON.stringify(data.player.training) ||
    JSON.stringify(regeneratedSave.player.magic) !== JSON.stringify(data.player.magic) ||
    JSON.stringify(regeneratedSave.player.textCombat) !== JSON.stringify(data.player.textCombat) ||
    JSON.stringify(regeneratedSave.player.trainerProgression) !== JSON.stringify(data.player.trainerProgression) ||
    JSON.stringify(regeneratedSave.player.smithing) !== JSON.stringify(data.player.smithing);

  return { save: regeneratedSave, changed };
}

export function saveGame(data: GameSave, resourceOptions?: ResourceRegenerationOptions) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data, resourceOptions).save));
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

export function isGameOverSave(save: GameSave | null | undefined) {
  return Boolean(save && (save.player.lifeState === "dead" || (save.player.combat?.currentHealth ?? 1) <= 0));
}

export function hasSave() {
  return !isGameOverSave(loadGame());
}

export function deleteSave() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(SAVE_KEY);
}
