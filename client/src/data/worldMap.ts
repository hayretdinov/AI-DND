export type WorldMapNodeId =
  | "oldVillage"
  | "darkForest"
  | "abandonedMine"
  | "ironCamp"
  | "ancientRuins"
  | "brokenBridge";

export type WorldMapNodeType = "village" | "forest" | "mine" | "camp" | "ruins" | "danger";

export type WorldMapIconType =
  | "northwest_winter_city"
  | "western_great_city"
  | "camp"
  | "central_settlement"
  | "northern_castle"
  | "southern_castle"
  | "cave"
  | "portal"
  | "necropolis"
  | "swamp"
  | "waterfall"
  | "volcanic_lava";

export type MapNode = {
  id: WorldMapNodeId;
  titleKey: string;
  descriptionKey: string;
  x: number;
  y: number;
  icon: string;
  iconType: WorldMapIconType;
  type: WorldMapNodeType;
  unlocked: boolean;
};

export type MapRoute = {
  from: WorldMapNodeId;
  to: WorldMapNodeId;
  dangerLevel: number;
};

export const WORLD_MAP_START_NODE_ID: WorldMapNodeId = "oldVillage";

export const worldMapNodes: MapNode[] = [
  {
    id: "oldVillage",
    titleKey: "worldMapOldVillageTitle",
    descriptionKey: "worldMapOldVillageDescription",
    x: 22,
    y: 65,
    icon: "H",
    iconType: "western_great_city",
    type: "village",
    unlocked: true,
  },
  {
    id: "darkForest",
    titleKey: "worldMapDarkForestTitle",
    descriptionKey: "worldMapDarkForestDescription",
    x: 40,
    y: 39,
    icon: "F",
    iconType: "swamp",
    type: "forest",
    unlocked: true,
  },
  {
    id: "abandonedMine",
    titleKey: "worldMapAbandonedMineTitle",
    descriptionKey: "worldMapAbandonedMineDescription",
    x: 64,
    y: 29,
    icon: "M",
    iconType: "cave",
    type: "mine",
    unlocked: true,
  },
  {
    id: "ironCamp",
    titleKey: "worldMapIronCampTitle",
    descriptionKey: "worldMapIronCampDescription",
    x: 55,
    y: 63,
    icon: "C",
    iconType: "camp",
    type: "camp",
    unlocked: true,
  },
  {
    id: "ancientRuins",
    titleKey: "worldMapAncientRuinsTitle",
    descriptionKey: "worldMapAncientRuinsDescription",
    x: 80,
    y: 54,
    icon: "R",
    iconType: "necropolis",
    type: "ruins",
    unlocked: false,
  },
  {
    id: "brokenBridge",
    titleKey: "worldMapBrokenBridgeTitle",
    descriptionKey: "worldMapBrokenBridgeDescription",
    x: 35,
    y: 78,
    icon: "B",
    iconType: "waterfall",
    type: "danger",
    unlocked: true,
  },
];

export const worldMapRoutes: MapRoute[] = [
  { from: "oldVillage", to: "darkForest", dangerLevel: 1 },
  { from: "oldVillage", to: "brokenBridge", dangerLevel: 0 },
  { from: "darkForest", to: "abandonedMine", dangerLevel: 2 },
  { from: "darkForest", to: "ironCamp", dangerLevel: 1 },
  { from: "brokenBridge", to: "ironCamp", dangerLevel: 1 },
  { from: "ironCamp", to: "ancientRuins", dangerLevel: 3 },
  { from: "abandonedMine", to: "ancientRuins", dangerLevel: 4 },
];

export function getWorldMapNodeById(id: WorldMapNodeId) {
  return worldMapNodes.find((node) => node.id === id) ?? worldMapNodes[0];
}

export function isWorldMapNodeId(value: unknown): value is WorldMapNodeId {
  return typeof value === "string" && worldMapNodes.some((node) => node.id === value);
}

export function getRouteBetween(from: WorldMapNodeId, to: WorldMapNodeId) {
  return worldMapRoutes.find(
    (route) => (route.from === from && route.to === to) || (route.from === to && route.to === from),
  );
}

export function getConnectedNodeIds(id: WorldMapNodeId) {
  return worldMapRoutes
    .filter((route) => route.from === id || route.to === id)
    .map((route) => (route.from === id ? route.to : route.from));
}
