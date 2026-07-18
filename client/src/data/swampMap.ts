import type { TranslationKey } from "../i18n/i18n";

export const SWAMP_MAP_ID = "cursed_swamps";
export const SWAMP_MAP_IMAGE = "/assets/maps/cursed_swamps_map.png";

export type SwampMapMarkerType =
  | "entrance"
  | "path"
  | "ruin"
  | "witch"
  | "cult"
  | "monster"
  | "secret"
  | "crypt";

export type SwampMapLocation = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  xPercent: number;
  yPercent: number;
  markerType: SwampMapMarkerType;
  eventId?: string;
  hidden?: boolean;
};

export const swampMapLocations: SwampMapLocation[] = [
  {
    id: "swamp_entrance",
    titleKey: "swamp.location.entrance.title",
    descriptionKey: "swamp.location.entrance.description",
    xPercent: 29.5,
    yPercent: 87.2,
    markerType: "entrance",
  },
  {
    id: "old_path",
    titleKey: "swamp.location.oldPath.title",
    descriptionKey: "swamp.location.oldPath.description",
    xPercent: 52.5,
    yPercent: 62.4,
    markerType: "path",
  },
  {
    id: "abandoned_chapel",
    titleKey: "swamp.location.abandonedChapel.title",
    descriptionKey: "swamp.location.abandonedChapel.description",
    xPercent: 72.1,
    yPercent: 51.4,
    markerType: "ruin",
  },
  {
    id: "ancient_stone_circle",
    titleKey: "swamp.location.stoneCircle.title",
    descriptionKey: "swamp.location.stoneCircle.description",
    xPercent: 66.4,
    yPercent: 16.6,
    markerType: "ruin",
  },
  {
    id: "witch_house",
    titleKey: "swamp.location.witchHouse.title",
    descriptionKey: "swamp.location.witchHouse.description",
    xPercent: 92.4,
    yPercent: 14.0,
    markerType: "witch",
    eventId: "swamp_witch_house",
  },
  {
    id: "ruined_tower",
    titleKey: "swamp.location.ruinedTower.title",
    descriptionKey: "swamp.location.ruinedTower.description",
    xPercent: 26.8,
    yPercent: 73.5,
    markerType: "ruin",
  },
  {
    id: "graveyard",
    titleKey: "swamp.location.graveyard.title",
    descriptionKey: "swamp.location.graveyard.description",
    xPercent: 54.2,
    yPercent: 44.8,
    markerType: "crypt",
  },
  {
    id: "swamp_islands",
    titleKey: "swamp.location.islands.title",
    descriptionKey: "swamp.location.islands.description",
    xPercent: 35.6,
    yPercent: 32.6,
    markerType: "path",
  },
  {
    id: "hydra_lair",
    titleKey: "swamp.location.hydraLair.title",
    descriptionKey: "swamp.location.hydraLair.description",
    xPercent: 28.6,
    yPercent: 18.8,
    markerType: "monster",
    eventId: "swamp_monster_lair",
  },
  {
    id: "cultist_camp",
    titleKey: "swamp.location.cultistCamp.title",
    descriptionKey: "swamp.location.cultistCamp.description",
    xPercent: 42.4,
    yPercent: 42.0,
    markerType: "cult",
    eventId: "swamp_cultist_camp",
  },
  {
    id: "sacrificial_altar",
    titleKey: "swamp.location.sacrificialAltar.title",
    descriptionKey: "swamp.location.sacrificialAltar.description",
    xPercent: 32.1,
    yPercent: 56.0,
    markerType: "cult",
    eventId: "swamp_cultist_altar",
  },
  {
    id: "sunken_wagons",
    titleKey: "swamp.location.sunkenWagons.title",
    descriptionKey: "swamp.location.sunkenWagons.description",
    xPercent: 28.9,
    yPercent: 87.8,
    markerType: "secret",
    hidden: true,
  },
  {
    id: "secret_paths",
    titleKey: "swamp.location.secretPaths.title",
    descriptionKey: "swamp.location.secretPaths.description",
    xPercent: 78.0,
    yPercent: 37.6,
    markerType: "secret",
    hidden: true,
  },
  {
    id: "hidden_chests",
    titleKey: "swamp.location.hiddenChests.title",
    descriptionKey: "swamp.location.hiddenChests.description",
    xPercent: 47.7,
    yPercent: 14.0,
    markerType: "secret",
    hidden: true,
  },
  {
    id: "underground_crypt",
    titleKey: "swamp.location.undergroundCrypt.title",
    descriptionKey: "swamp.location.undergroundCrypt.description",
    xPercent: 61.6,
    yPercent: 36.6,
    markerType: "crypt",
    eventId: "swamp_flooded_crypt",
  },
  {
    id: "giant_toad_nest",
    titleKey: "swamp.location.giantToadNest.title",
    descriptionKey: "swamp.location.giantToadNest.description",
    xPercent: 73.8,
    yPercent: 29.2,
    markerType: "monster",
    eventId: "swamp_giant_toad_nest",
  },
  {
    id: "snake_temple",
    titleKey: "swamp.location.snakeTemple.title",
    descriptionKey: "swamp.location.snakeTemple.description",
    xPercent: 66.1,
    yPercent: 15.2,
    markerType: "monster",
    eventId: "swamp_snake_temple",
  },
];

export function getSwampMapLocationById(locationId: string) {
  return swampMapLocations.find((location) => location.id === locationId);
}
