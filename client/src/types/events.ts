import type { TranslationKey } from "../i18n/i18n";
import type { WorldMapNodeId } from "../data/worldMap";

export type ActiveEventContext = {
  eventId: string;
  npcId?: string;
  npcTemplateId?: string;
  npcInstanceId?: string;
  returnTo: "worldMap" | "cityMap" | "swampMap";
  cityId?: string;
  cityLocationId?: string;
  swampLocationId?: string;
  pendingTravelTargetId?: WorldMapNodeId;
  resumeTravelAfterEvent?: boolean;
};

export type PendingRandomTravelEvent = {
  eventId: string;
  npcTemplateId?: string;
  npcInstanceId?: string;
  fromId: WorldMapNodeId;
  targetId: WorldMapNodeId;
  triggerProgress: number;
};

export type LocationEventDefinition = {
  id: string;
  titleKey: TranslationKey;
  locationTitleKey: TranslationKey;
  locationSubtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  backgroundImage: string;
  npcId?: string;
  locationId: WorldMapNodeId;
  type: "gate" | "necropolis" | "merchant" | "npc";
};

export type TravelEventDefinition = {
  id: string;
  titleKey: TranslationKey;
  locationTitleKey: TranslationKey;
  locationSubtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  backgroundImage: string;
  npcId: string;
  type: "bandit" | "beast";
  weight?: number;
};
