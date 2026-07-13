import type { LocationEventDefinition } from "../types/events";
import { getRoyalCourtEventId, royalCourtNpcTemplates } from "./royalCourtNpcs";

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
    id: "merchant_western_city",
    titleKey: "event.merchant.title",
    locationTitleKey: "worldMapWesternGreatCityTitle",
    locationSubtitleKey: "event.merchant.subtitle",
    descriptionKey: "event.merchant.description",
    backgroundImage: `${LOCATION_ASSET_PATH}eastern_city.png`,
    npcId: "merchant_western_city",
    locationId: "western_great_city",
    type: "merchant",
  },
  {
    id: "merchant_southern_city",
    titleKey: "event.merchant.title",
    locationTitleKey: "worldMapSouthernCastleTitle",
    locationSubtitleKey: "event.merchant.subtitle",
    descriptionKey: "event.merchant.description",
    backgroundImage: `${LOCATION_ASSET_PATH}southern_city.png`,
    npcId: "merchant_southern_city",
    locationId: "southern_castle",
    type: "merchant",
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
  {
    id: "merchant_central_settlement",
    titleKey: "event.merchant.title",
    locationTitleKey: "worldMapCentralSettlementTitle",
    locationSubtitleKey: "event.merchant.subtitle",
    descriptionKey: "event.merchant.description",
    backgroundImage: `${LOCATION_ASSET_PATH}central_settlement.png`,
    npcId: "merchant_central_settlement",
    locationId: "central_settlement",
    type: "merchant",
  },
  {
    id: "necropolis_gate",
    titleKey: "event.necropolis.title",
    locationTitleKey: "worldMapNecropolisSkullCastleTitle",
    locationSubtitleKey: "event.necropolis.subtitle",
    descriptionKey: "event.necropolis.description",
    backgroundImage: `${LOCATION_ASSET_PATH}necropolis.png`,
    locationId: "necropolis_skull_castle",
    type: "necropolis",
  },
  ...royalCourtNpcTemplates.map((npc): LocationEventDefinition => ({
    id: getRoyalCourtEventId(npc.id),
    titleKey: npc.nameKey,
    locationTitleKey: "worldMapWesternGreatCityTitle",
    locationSubtitleKey: "event.royalCourt.subtitle",
    descriptionKey: "event.royalCourt.description",
    backgroundImage: `${LOCATION_ASSET_PATH}eastern_city.png`,
    npcId: npc.id,
    locationId: "western_great_city",
    type: "npc",
  })),
];

export function getLocationEventById(eventId: string) {
  return locationEvents.find((event) => event.id === eventId);
}

export function getGateEventForLocation(locationId: string) {
  return locationEvents.find((event) => event.type === "gate" && event.locationId === locationId);
}
