import { t, type TranslationKey } from "../i18n/i18n";
import { cityMapLocations } from "./cityMap";
import { npcDefinitions } from "./npcs";
import { worldMapNodes, type WorldMapNodeId } from "./worldMap";
import type { NpcDefinition } from "../types/npc";

export type SettlementEntity = {
  id: WorldMapNodeId;
  titleKey: TranslationKey;
  type: "settlement" | "danger" | "camp";
};

export type RegisteredLocation = {
  id: string;
  settlementId?: WorldMapNodeId;
  titleKey: TranslationKey;
  type: string;
};

export type RegisteredNpc = NpcDefinition & {
  homeSettlementId?: WorldMapNodeId;
  usualLocationId?: string;
};

const worldNodeTypeToSettlementType: Record<string, SettlementEntity["type"]> = {
  location: "settlement",
  camp_point: "camp",
  danger_point: "danger",
};

export const settlementRegistry: SettlementEntity[] = worldMapNodes.map((node) => ({
  id: node.id,
  titleKey: node.titleKey as TranslationKey,
  type: worldNodeTypeToSettlementType[node.type] ?? "danger",
}));

export const locationRegistry: RegisteredLocation[] = [
  ...worldMapNodes.map((node) => ({
    id: node.id,
    settlementId: node.id,
    titleKey: node.titleKey as TranslationKey,
    type: node.type,
  })),
  ...cityMapLocations.map((location) => ({
    id: location.id,
    settlementId: location.cityId,
    titleKey: location.titleKey,
    type: location.markerType,
  })),
];

export const npcRegistry: RegisteredNpc[] = npcDefinitions.map((npc) => ({
  ...npc,
  homeSettlementId: npc.locationId,
  usualLocationId: npc.interiorLocationId ?? npc.locationId,
}));

export function getNpcByRegistryId(id: string) {
  return npcRegistry.find((npc) => npc.id === id);
}

export function getLocationById(id: string) {
  return locationRegistry.find((location) => location.id === id);
}

export function getSettlementById(id: string) {
  return settlementRegistry.find((settlement) => settlement.id === id);
}

export function getKnownNpcsForSettlement(settlementId?: string) {
  if (!settlementId) {
    return [];
  }

  return npcRegistry.filter((npc) => npc.homeSettlementId === settlementId);
}

export function getKnownLocationsForSettlement(settlementId?: string) {
  if (!settlementId) {
    return [];
  }

  return locationRegistry.filter((location) => location.settlementId === settlementId);
}

export function isRegisteredNpcId(id: string) {
  return Boolean(getNpcByRegistryId(id));
}

export function isRegisteredLocationId(id: string) {
  return Boolean(getLocationById(id));
}

export function getRegistryDisplayName(key: TranslationKey) {
  return t(key);
}
