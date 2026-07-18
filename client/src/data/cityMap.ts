import { getRoyalCourtEventId } from "./royalCourtNpcs";
import { getNpcById } from "./npcs";
import { getTrainerEventId } from "./trainerNpcs";
import type { CityId, CityMapLocation, CityMapNpcPlacement } from "../types/city";

export const WESTERN_GREAT_CITY_ID: CityId = "western_great_city";
export const CENTRAL_SETTLEMENT_ID: CityId = "central_settlement";
export const WESTERN_GREAT_CITY_MAP_IMAGE = "/assets/maps/western_great_city_map.png";
export const CENTRAL_SETTLEMENT_MAP_IMAGE = "/assets/maps/central_settlement_map.png";

export const cityMapDefinitions: Record<CityId, {
  image: string;
  titleKey: "worldMapWesternGreatCityTitle" | "worldMapCentralSettlementTitle";
  defaultLocationId: string;
  exitLocationId: string;
}> = {
  western_great_city: {
    image: WESTERN_GREAT_CITY_MAP_IMAGE,
    titleKey: "worldMapWesternGreatCityTitle",
    defaultLocationId: "western_gate",
    exitLocationId: "western_gate",
  },
  central_settlement: {
    image: CENTRAL_SETTLEMENT_MAP_IMAGE,
    titleKey: "worldMapCentralSettlementTitle",
    defaultLocationId: "central_south_gate",
    exitLocationId: "central_south_gate",
  },
};

export const cityMapLocations: CityMapLocation[] = [
  {
    id: "royal_palace",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.royalPalace.title",
    descriptionKey: "city.location.royalPalace.description",
    xPercent: 54.7,
    yPercent: 17.5,
    markerType: "palace",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needPalacePermission",
  },
  {
    id: "royal_throne_hall",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.throneHall.title",
    descriptionKey: "city.location.throneHall.description",
    xPercent: 54.7,
    yPercent: 17.5,
    markerType: "palace",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needRoyalAudience",
  },
  {
    id: "great_temple",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.greatTemple.title",
    descriptionKey: "city.location.greatTemple.description",
    xPercent: 65.8,
    yPercent: 27.4,
    markerType: "temple",
    initiallyDiscovered: true,
  },
  {
    id: "ancient_archive",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.ancientArchive.title",
    descriptionKey: "city.location.ancientArchive.description",
    xPercent: 66.8,
    yPercent: 55.0,
    markerType: "archive",
    initiallyDiscovered: true,
  },
  {
    id: "royal_chancellery",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.chancellery.title",
    descriptionKey: "city.location.chancellery.description",
    xPercent: 74.8,
    yPercent: 41.2,
    markerType: "palace",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needOfficialReason",
  },
  {
    id: "circle_of_archons_tower",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.archonsTower.title",
    descriptionKey: "city.location.archonsTower.description",
    xPercent: 83.9,
    yPercent: 29.3,
    markerType: "archive",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needMageTowerAccess",
  },
  {
    id: "private_arcane_study",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.privateStudy.title",
    descriptionKey: "city.location.privateStudy.description",
    xPercent: 83.9,
    yPercent: 29.3,
    markerType: "archive",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needMageTowerAccess",
  },
  {
    id: "military_headquarters",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.militaryHeadquarters.title",
    descriptionKey: "city.location.militaryHeadquarters.description",
    xPercent: 83.5,
    yPercent: 59.4,
    markerType: "military",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needMilitaryReason",
  },
  {
    id: "royal_guard_headquarters",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.guardHeadquarters.title",
    descriptionKey: "city.location.guardHeadquarters.description",
    xPercent: 40.5,
    yPercent: 21.1,
    markerType: "military",
    initiallyDiscovered: true,
    locked: true,
    unavailableReasonKey: "city.access.needGuardPermission",
  },
  {
    id: "main_square",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.mainSquare.title",
    descriptionKey: "city.location.mainSquare.description",
    xPercent: 56.2,
    yPercent: 37.6,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "city_market",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.cityMarket.title",
    descriptionKey: "city.location.cityMarket.description",
    xPercent: 45.7,
    yPercent: 47.9,
    markerType: "market",
    initiallyDiscovered: true,
  },
  {
    id: "smith_guild",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.smithGuild.title",
    descriptionKey: "city.location.smithGuild.description",
    xPercent: 69.9,
    yPercent: 41.0,
    markerType: "guild",
    initiallyDiscovered: true,
  },
  {
    id: "western_gate",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.westernGate.title",
    descriptionKey: "city.location.westernGate.description",
    xPercent: 29.8,
    yPercent: 45.6,
    markerType: "gate",
    initiallyDiscovered: true,
  },
  {
    id: "port",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.port.title",
    descriptionKey: "city.location.port.description",
    xPercent: 30.0,
    yPercent: 62.8,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "lower_city",
    cityId: WESTERN_GREAT_CITY_ID,
    titleKey: "city.location.lowerCity.title",
    descriptionKey: "city.location.lowerCity.description",
    xPercent: 53.2,
    yPercent: 78.8,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_elder_house",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralElderHouse.title",
    descriptionKey: "city.location.centralElderHouse.description",
    xPercent: 65.5,
    yPercent: 27.2,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_common_house",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralCommonHouse.title",
    descriptionKey: "city.location.centralCommonHouse.description",
    xPercent: 49.7,
    yPercent: 34.0,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_town_hall",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralTownHall.title",
    descriptionKey: "city.location.centralTownHall.description",
    xPercent: 64.1,
    yPercent: 45.8,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_blacksmith",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralBlacksmith.title",
    descriptionKey: "city.location.centralBlacksmith.description",
    xPercent: 30.5,
    yPercent: 37.0,
    markerType: "guild",
    initiallyDiscovered: true,
  },
  {
    id: "central_light_altar",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralLightAltar.title",
    descriptionKey: "city.location.centralLightAltar.description",
    xPercent: 52.6,
    yPercent: 50.7,
    markerType: "temple",
    initiallyDiscovered: true,
  },
  {
    id: "central_market_square",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralMarketSquare.title",
    descriptionKey: "city.location.centralMarketSquare.description",
    xPercent: 51.7,
    yPercent: 61.5,
    markerType: "market",
    initiallyDiscovered: true,
  },
  {
    id: "central_tavern",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralTavern.title",
    descriptionKey: "city.location.centralTavern.description",
    xPercent: 62.4,
    yPercent: 64.5,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_warehouse",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralWarehouse.title",
    descriptionKey: "city.location.centralWarehouse.description",
    xPercent: 78.6,
    yPercent: 52.4,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_artisan_houses",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralArtisanHouses.title",
    descriptionKey: "city.location.centralArtisanHouses.description",
    xPercent: 71.8,
    yPercent: 37.8,
    markerType: "guild",
    initiallyDiscovered: true,
  },
  {
    id: "central_resident_houses",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralResidentHouses.title",
    descriptionKey: "city.location.centralResidentHouses.description",
    xPercent: 32.8,
    yPercent: 56.5,
    markerType: "district",
    initiallyDiscovered: true,
  },
  {
    id: "central_north_gate",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralNorthGate.title",
    descriptionKey: "city.location.centralNorthGate.description",
    xPercent: 57.4,
    yPercent: 11.2,
    markerType: "gate",
    initiallyDiscovered: true,
  },
  {
    id: "central_training_yard",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralTrainingYard.title",
    descriptionKey: "city.location.centralTrainingYard.description",
    xPercent: 42.5,
    yPercent: 49.5,
    markerType: "military",
    initiallyDiscovered: true,
  },
  {
    id: "central_archery_range",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralArcheryRange.title",
    descriptionKey: "city.location.centralArcheryRange.description",
    xPercent: 78.0,
    yPercent: 33.5,
    markerType: "guild",
    initiallyDiscovered: true,
  },
  {
    id: "central_mage_hut",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralMageHut.title",
    descriptionKey: "city.location.centralMageHut.description",
    xPercent: 57.0,
    yPercent: 47.0,
    markerType: "archive",
    initiallyDiscovered: true,
  },
  {
    id: "central_south_gate",
    cityId: CENTRAL_SETTLEMENT_ID,
    titleKey: "city.location.centralSouthGate.title",
    descriptionKey: "city.location.centralSouthGate.description",
    xPercent: 52.4,
    yPercent: 82.5,
    markerType: "gate",
    initiallyDiscovered: true,
  },
];

const placementData: Array<Omit<CityMapNpcPlacement, "imageUrl" | "portraitUrl">> = [
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "king_aldric_iv",
    locationId: "royal_throne_hall",
    xPercent: 54.7,
    yPercent: 17.5,
    visible: true,
    available: false,
    unavailableReasonKey: "city.access.needRoyalAudience",
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "queen_miranda",
    locationId: "royal_palace",
    xPercent: 52.8,
    yPercent: 19.4,
    visible: true,
    available: false,
    unavailableReasonKey: "city.access.needInvitation",
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "prince_leon",
    locationId: "royal_palace",
    xPercent: 56.7,
    yPercent: 20.4,
    visible: true,
    available: false,
    unavailableReasonKey: "city.access.princeUnavailable",
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "imperial_chancellor_orton",
    locationId: "royal_chancellery",
    xPercent: 74.8,
    yPercent: 41.2,
    visible: true,
    available: false,
    unavailableReasonKey: "city.access.needOfficialReason",
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "general_vargas",
    locationId: "military_headquarters",
    xPercent: 83.5,
    yPercent: 59.4,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "lord_commander_cedric",
    locationId: "royal_guard_headquarters",
    xPercent: 40.5,
    yPercent: 21.1,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "high_mage_elyrion",
    locationId: "circle_of_archons_tower",
    xPercent: 83.9,
    yPercent: 29.3,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "archmage_tarvis",
    locationId: "private_arcane_study",
    xPercent: 82.3,
    yPercent: 31.5,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "high_priest_solan",
    locationId: "great_temple",
    xPercent: 65.8,
    yPercent: 27.4,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "archive_keeper_edran",
    locationId: "ancient_archive",
    xPercent: 66.8,
    yPercent: 55.0,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "western_city_blacksmith",
    locationId: "smith_guild",
    xPercent: 69.9,
    yPercent: 41.0,
    visible: true,
    available: true,
  },
  {
    cityId: WESTERN_GREAT_CITY_ID,
    npcInstanceId: "city_merchant_main",
    locationId: "city_market",
    xPercent: 45.7,
    yPercent: 47.9,
    visible: true,
    available: true,
  },
  {
    cityId: CENTRAL_SETTLEMENT_ID,
    npcInstanceId: "central_blacksmith_dultran",
    locationId: "central_blacksmith",
    xPercent: 30.5,
    yPercent: 37.0,
    visible: true,
    available: true,
  },
  {
    cityId: CENTRAL_SETTLEMENT_ID,
    npcInstanceId: "edgar_swordmaster",
    locationId: "central_training_yard",
    xPercent: 42.5,
    yPercent: 49.5,
    visible: true,
    available: true,
  },
  {
    cityId: CENTRAL_SETTLEMENT_ID,
    npcInstanceId: "iara_archer",
    locationId: "central_archery_range",
    xPercent: 78.0,
    yPercent: 33.5,
    visible: true,
    available: true,
  },
  {
    cityId: CENTRAL_SETTLEMENT_ID,
    npcInstanceId: "arkel_magister",
    locationId: "central_mage_hut",
    xPercent: 57.0,
    yPercent: 47.0,
    visible: true,
    available: true,
  },
  {
    cityId: CENTRAL_SETTLEMENT_ID,
    npcInstanceId: "merchant_central_settlement",
    locationId: "central_market_square",
    xPercent: 51.7,
    yPercent: 61.5,
    visible: true,
    available: true,
  },
];

export const cityMapNpcPlacements: CityMapNpcPlacement[] = placementData.map((placement) => {
  const npc = getNpcById(placement.npcInstanceId);

  return {
    ...placement,
    imageUrl: npc?.imageUrl,
    portraitUrl: npc?.portraitUrl,
  };
});

export function getCityMapLocations(cityId: CityId) {
  return cityMapLocations.filter((location) => location.cityId === cityId);
}

export function getCityMapNpcPlacements(cityId: CityId) {
  return cityMapNpcPlacements.filter((placement) => placement.cityId === cityId && placement.visible);
}

export function getCityMapNpcEventId(npcInstanceId: string) {
  if (
    npcInstanceId === "edgar_swordmaster" ||
    npcInstanceId === "iara_archer" ||
    npcInstanceId === "arkel_magister"
  ) {
    return getTrainerEventId(npcInstanceId);
  }

  if (npcInstanceId === "merchant_central_settlement") {
    return "merchant_central_settlement";
  }

  if (npcInstanceId === "central_blacksmith_dultran") {
    return "central_blacksmith_dultran";
  }

  return npcInstanceId === "city_merchant_main" || npcInstanceId === "merchant_western_city"
    ? "merchant_western_city"
    : getRoyalCourtEventId(npcInstanceId);
}
