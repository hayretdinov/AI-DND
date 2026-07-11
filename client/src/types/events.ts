import type { TranslationKey } from "../i18n/i18n";
import type { WorldMapNodeId } from "../data/worldMap";

export type ActiveEventContext = {
  eventId: string;
  npcId?: string;
  returnTo: "worldMap";
  pendingTravelTargetId?: WorldMapNodeId;
};

export type LocationEventDefinition = {
  id: string;
  titleKey: TranslationKey;
  locationTitleKey: TranslationKey;
  locationSubtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  backgroundImage: string;
  npcId: string;
  locationId: WorldMapNodeId;
  type: "gate";
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
};
