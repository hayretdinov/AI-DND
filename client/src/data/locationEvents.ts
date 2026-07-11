import type { LocationEventDefinition } from "../types/events";

const LOCATION_ASSET_PATH = "/assets/locations/";

export const locationEvents: LocationEventDefinition[] = [
  {
    id: "gate_western_great_city",
    titleKey: "event.gate.title",
    locationTitleKey: "worldMapWesternGreatCityTitle",
    locationSubtitleKey: "event.gate.subtitle",
    descriptionKey: "event.gate.description",
    backgroundImage: `${LOCATION_ASSET_PATH}eastern_city.png`,
    npcId: "guard_western_city_gate",
    locationId: "western_great_city",
    type: "gate",
  },
  {
    id: "gate_southern_castle",
    titleKey: "event.gate.title",
    locationTitleKey: "worldMapSouthernCastleTitle",
    locationSubtitleKey: "event.gate.subtitle",
    descriptionKey: "event.gate.description",
    backgroundImage: `${LOCATION_ASSET_PATH}southern_city.png`,
    npcId: "guard_southern_city_gate",
    locationId: "southern_castle",
    type: "gate",
  },
  {
    id: "gate_northern_castle",
    titleKey: "event.gate.title",
    locationTitleKey: "worldMapNorthernCastleTitle",
    locationSubtitleKey: "event.gate.subtitle",
    descriptionKey: "event.gate.description",
    backgroundImage: `${LOCATION_ASSET_PATH}northern_city.png`,
    npcId: "guard_northern_castle_gate",
    locationId: "northern_castle",
    type: "gate",
  },
  {
    id: "gate_winter_city",
    titleKey: "event.gate.title",
    locationTitleKey: "worldMapNorthwestWinterCityTitle",
    locationSubtitleKey: "event.gate.subtitle",
    descriptionKey: "event.gate.description",
    backgroundImage: `${LOCATION_ASSET_PATH}winter_city.png`,
    npcId: "guard_northern_castle_gate",
    locationId: "northwest_winter_city",
    type: "gate",
  },
  {
    id: "gate_central_settlement",
    titleKey: "event.gate.title",
    locationTitleKey: "worldMapCentralSettlementTitle",
    locationSubtitleKey: "event.gate.subtitle",
    descriptionKey: "event.gate.description",
    backgroundImage: `${LOCATION_ASSET_PATH}central_settlement.png`,
    npcId: "guard_central_settlement_gate",
    locationId: "central_settlement",
    type: "gate",
  },
];

export function getLocationEventById(eventId: string) {
  return locationEvents.find((event) => event.id === eventId);
}

export function getGateEventForLocation(locationId: string) {
  return locationEvents.find((event) => event.locationId === locationId);
}
