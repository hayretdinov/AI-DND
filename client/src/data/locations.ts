export type LocationId =
  | "iron_camp"
  | "ash_village"
  | "old_mine"
  | "broken_forest"
  | "fracture_edge";

export type LocationData = {
  id: LocationId;
  nameKey: string;
  descriptionKey: string;
  dangerLevel: number;
  x: number;
  y: number;
  available: boolean;
  travelTimeHours: number;
};

export const locations: LocationData[] = [
  {
    id: "iron_camp",
    nameKey: "locations.ironCamp.name",
    descriptionKey: "locations.ironCamp.description",
    dangerLevel: 1,
    x: 28,
    y: 58,
    available: true,
    travelTimeHours: 0,
  },
  {
    id: "ash_village",
    nameKey: "locations.ashVillage.name",
    descriptionKey: "locations.ashVillage.description",
    dangerLevel: 2,
    x: 46,
    y: 48,
    available: true,
    travelTimeHours: 5,
  },
  {
    id: "old_mine",
    nameKey: "locations.oldMine.name",
    descriptionKey: "locations.oldMine.description",
    dangerLevel: 3,
    x: 62,
    y: 35,
    available: true,
    travelTimeHours: 7,
  },
  {
    id: "broken_forest",
    nameKey: "locations.brokenForest.name",
    descriptionKey: "locations.brokenForest.description",
    dangerLevel: 4,
    x: 38,
    y: 24,
    available: true,
    travelTimeHours: 9,
  },
  {
    id: "fracture_edge",
    nameKey: "locations.fractureEdge.name",
    descriptionKey: "locations.fractureEdge.description",
    dangerLevel: 5,
    x: 78,
    y: 18,
    available: true,
    travelTimeHours: 12,
  },
];

export function getLocationById(id: LocationId): LocationData | undefined {
  return locations.find((location) => location.id === id);
}