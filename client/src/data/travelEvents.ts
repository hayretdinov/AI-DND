import type { TravelEventDefinition } from "../types/events";

const LOCATION_ASSET_PATH = "/assets/locations/";

export const TRAVEL_EVENT_CHANCE = 0.7;

export const travelEvents: TravelEventDefinition[] = [
  {
    id: "travel_hooded_bandit",
    titleKey: "event.travel.hoodedBandit.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.hoodedBandit.description",
    backgroundImage: `${LOCATION_ASSET_PATH}road_camp.png`,
    npcId: "hooded_bandit_01",
    type: "bandit",
    weight: 5,
  },
  {
    id: "travel_bandit_ambush",
    titleKey: "event.travel.bandit.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.bandit.description",
    backgroundImage: `${LOCATION_ASSET_PATH}road_camp.png`,
    npcId: "road_bandit_01",
    type: "bandit",
    weight: 2,
  },
  {
    id: "travel_bandit_erik",
    titleKey: "event.travel.banditErik.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.banditErik.description",
    backgroundImage: `${LOCATION_ASSET_PATH}road_camp.png`,
    npcId: "bandit_erik",
    type: "bandit",
  },
  {
    id: "travel_orc_bandit_milka",
    titleKey: "event.travel.orcBanditMilka.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.orcBanditMilka.description",
    backgroundImage: `${LOCATION_ASSET_PATH}forest_location.png`,
    npcId: "orc_bandit_milka",
    type: "bandit",
  },
  {
    id: "travel_forest_beast",
    titleKey: "event.travel.beast.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.beast.description",
    backgroundImage: `${LOCATION_ASSET_PATH}forest_location.png`,
    npcId: "forest_beast_01",
    type: "beast",
  },
];

export function getTravelEventById(eventId: string) {
  return travelEvents.find(
    (event) => event.id === eventId || (eventId === "travel_road_bandit" && event.id === "travel_bandit_ambush"),
  );
}
