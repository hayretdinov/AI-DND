import {
  getKnownLocationsForSettlement,
  getKnownNpcsForSettlement,
  getLocationById,
  getNpcByRegistryId,
  getRegistryDisplayName,
  getSettlementById,
  isRegisteredLocationId,
  isRegisteredNpcId,
  type RegisteredLocation,
  type RegisteredNpc,
  type SettlementEntity,
} from "../../data/worldEntityRegistry";
import type { GameSave } from "../save/saveSystem";
import type { NpcDefinition, NpcRuntimeState } from "../../types/npc";

const NPC_MARKER_PATTERN = /\[\[MENTION_NPC:([a-zA-Z0-9_-]+)\]\]/g;
const LOCATION_MARKER_PATTERN = /\[\[MENTION_LOCATION:([a-zA-Z0-9_-]+)\]\]/g;

export type NpcKnowledgeContext = {
  self: RegisteredNpc | NpcDefinition;
  homeSettlement?: SettlementEntity;
  currentSettlement?: SettlementEntity;
  knownNpcs: RegisteredNpc[];
  knownLocations: RegisteredLocation[];
  knownRoads: string[];
  knownFactions: string[];
  personalMemories: string[];
  verifiedFacts: string[];
  rumors: string[];
};

export function buildNpcKnowledgeContext(
  npc: NpcDefinition,
  options: {
    save?: GameSave;
    state?: NpcRuntimeState;
  } = {},
): NpcKnowledgeContext {
  const registeredSelf = getNpcByRegistryId(npc.id) ?? npc;
  const homeSettlementId = registeredSelf.locationId ?? options.save?.currentLocationId;
  const homeSettlement = homeSettlementId ? getSettlementById(homeSettlementId) : undefined;
  const currentSettlement = options.save?.currentLocationId
    ? getSettlementById(options.save.currentLocationId)
    : homeSettlement;
  const knownNpcs = getKnownNpcsForSettlement(homeSettlementId);
  const knownLocations = getKnownLocationsForSettlement(homeSettlementId);
  const knownFactions = Array.from(new Set(knownNpcs.map((knownNpc) => knownNpc.faction).filter(Boolean) as string[]));
  const recentMemory = options.state?.dialogueHistory.slice(-6).map((message) => `${message.speaker}: ${message.text}`) ?? [];
  const learnedKnowledge = options.state?.learnedKnowledge ?? [];

  return {
    self: registeredSelf,
    homeSettlement,
    currentSettlement,
    knownNpcs,
    knownLocations,
    knownRoads: [],
    knownFactions,
    personalMemories: recentMemory,
    verifiedFacts: learnedKnowledge.filter((entry) => entry.certainty === "WITNESSED").map((entry) => entry.text),
    rumors: learnedKnowledge.filter((entry) => entry.certainty === "HEARD" || entry.certainty === "RUMOR").map((entry) => entry.text),
  };
}

function formatKnownNpc(npc: RegisteredNpc) {
  const role = npc.profession ?? npc.role;
  const location = npc.usualLocationId ? getLocationById(npc.usualLocationId) : undefined;
  const locationText = location ? getRegistryDisplayName(location.titleKey) : npc.locationId ?? "unknown";

  return `- ${npc.id}: ${getRegistryDisplayName(npc.nameKey)}, ${role}, usual location: ${locationText}`;
}

function formatKnownLocation(location: RegisteredLocation) {
  return `- ${location.id}: ${getRegistryDisplayName(location.titleKey)}, type: ${location.type}`;
}

export function formatNpcKnowledgePrompt(context: NpcKnowledgeContext) {
  const homeSettlementName = context.homeSettlement ? getRegistryDisplayName(context.homeSettlement.titleKey) : "unknown";
  const currentSettlementName = context.currentSettlement ? getRegistryDisplayName(context.currentSettlement.titleKey) : homeSettlementName;
  const npcLines = context.knownNpcs.length > 0 ? context.knownNpcs.map(formatKnownNpc).join("\n") : "- none";
  const locationLines = context.knownLocations.length > 0 ? context.knownLocations.map(formatKnownLocation).join("\n") : "- none";
  const factionLines = context.knownFactions.length > 0 ? context.knownFactions.map((faction) => `- ${faction}`).join("\n") : "- none";
  const memoryLines = context.personalMemories.length > 0 ? context.personalMemories.map((memory) => `- ${memory}`).join("\n") : "- none";
  const rumorLines = context.rumors.length > 0 ? context.rumors.map((rumor) => `- [HEARD/RUMOR] ${rumor}`).join("\n") : "- none";

  return [
    "LOCAL WORLD KNOWLEDGE:",
    `Home settlement: ${homeSettlementName}. Current settlement: ${currentSettlementName}.`,
    "You may mention concrete NPCs only from KNOWN NPCS. Do not invent people.",
    "You may mention concrete places only from KNOWN LOCATIONS. Do not invent cities, towers, taverns, roads, temples, shops, caves, or districts.",
    "If the player asks about an unknown person or place, say you do not know it or that it is not in this settlement.",
    "Do not use another NPC's memories. Do not reveal hidden state, secrets, or save data.",
    "Optional game-reference markers are allowed only for registered known entities: [[MENTION_NPC:npc_id]] and [[MENTION_LOCATION:location_id]]. Do not use markers in ordinary speech unless a game reference is useful.",
    "KNOWN NPCS:",
    npcLines,
    "KNOWN LOCATIONS:",
    locationLines,
    "KNOWN FACTIONS:",
    factionLines,
    "PERSONAL MEMORY:",
    memoryLines,
    "LEARNED RUMORS:",
    rumorLines,
  ].join("\n");
}

function stripInvalidMarker(id: string, isKnown: boolean) {
  if (!isKnown) {
    console.warn("[NpcKnowledge] Unknown mention marker ignored", { id });
  }

  return "";
}

export function validateNpcWorldReferences(response: string, context: NpcKnowledgeContext) {
  const knownNpcIds = new Set(context.knownNpcs.map((npc) => npc.id));
  const knownLocationIds = new Set(context.knownLocations.map((location) => location.id));
  const mentionedNpcIds: string[] = [];
  const mentionedLocationIds: string[] = [];

  const cleanText = response
    .replace(NPC_MARKER_PATTERN, (_marker, npcId: string) => {
      const isKnown = isRegisteredNpcId(npcId) && knownNpcIds.has(npcId);

      if (isKnown) {
        mentionedNpcIds.push(npcId);
      }

      return stripInvalidMarker(npcId, isKnown);
    })
    .replace(LOCATION_MARKER_PATTERN, (_marker, locationId: string) => {
      const isKnown = isRegisteredLocationId(locationId) && knownLocationIds.has(locationId);

      if (isKnown) {
        mentionedLocationIds.push(locationId);
      }

      return stripInvalidMarker(locationId, isKnown);
    })
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    cleanText,
    mentionedNpcIds,
    mentionedLocationIds,
  };
}
