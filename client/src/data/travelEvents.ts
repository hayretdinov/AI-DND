import type { TravelEventDefinition } from "../types/events";

const LOCATION_ASSET_PATH = "/assets/locations/";

export const TRAVEL_EVENT_CHANCE = 0.25;

export const travelEvents: TravelEventDefinition[] = [
  {
    id: "travel_road_bandit",
    titleKey: "event.travel.bandit.title",
    locationTitleKey: "event.travel.locationTitle",
    locationSubtitleKey: "event.travel.locationSubtitle",
    descriptionKey: "event.travel.bandit.description",
    backgroundImage: `${LOCATION_ASSET_PATH}rocky_trail.png`,
    npcId: "road_bandit_01",
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
  return travelEvents.find((event) => event.id === eventId);
}
