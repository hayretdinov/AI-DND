export type WorldMapNodeId =
  | "northwest_winter_city"
  | "western_great_city"
  | "camp_location"
  | "central_settlement"
  | "northern_castle"
  | "southern_castle"
  | "cave_location"
  | "portal_location"
  | "necropolis_skull_castle"
  | "swamp_location"
  | "waterfall_location"
  | "volcanic_lava_location"
  | "road_west_01"
  | "road_west_02"
  | "road_center_01"
  | "road_center_north_01"
  | "road_lake_crossing"
  | "road_north_pass_01"
  | "road_volcanic_01"
  | "road_southwest_01"
  | "road_southwest_02"
  | "road_south_01"
  | "road_southeast_01"
  | "road_east_01"
  | "road_dark_fork_01"
  | "road_marsh_01"
  | "road_marsh_02";

export type WorldMapNodeType = "location" | "road_point" | "danger_point" | "camp_point";

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
  | "volcanic_lava"
  | "road_point";

export type MapNode = {
  id: WorldMapNodeId;
  titleKey: string;
  descriptionKey: string;
  x: number;
  y: number;
  icon: string;
  iconType?: WorldMapIconType;
  type: WorldMapNodeType;
  unlocked: boolean;
};

export type MapRoute = {
  from: WorldMapNodeId;
  to: WorldMapNodeId;
  dangerLevel: number;
  travelTimeHours: number;
  energyCost: number;
  pathPoints?: Array<{ x: number; y: number }>;
};

export const WORLD_MAP_START_NODE_ID: WorldMapNodeId = "western_great_city";

export const worldMapNodes: MapNode[] = [
  {
    id: "northwest_winter_city",
    titleKey: "worldMapNorthwestWinterCityTitle",
    descriptionKey: "worldMapNorthwestWinterCityDescription",
    x: 21.3,
    y: 22.9,
    icon: "N",
    iconType: "northwest_winter_city",
    type: "location",
    unlocked: true,
  },
  {
    id: "western_great_city",
    titleKey: "worldMapWesternGreatCityTitle",
    descriptionKey: "worldMapWesternGreatCityDescription",
    x: 24.9,
    y: 64.6,
    icon: "W",
    iconType: "western_great_city",
    type: "location",
    unlocked: true,
  },
  {
    id: "camp_location",
    titleKey: "worldMapCampLocationTitle",
    descriptionKey: "worldMapCampLocationDescription",
    x: 65.1,
    y: 44.3,
    icon: "C",
    iconType: "camp",
    type: "camp_point",
    unlocked: true,
  },
  {
    id: "central_settlement",
    titleKey: "worldMapCentralSettlementTitle",
    descriptionKey: "worldMapCentralSettlementDescription",
    x: 49.8,
    y: 51.2,
    icon: "S",
    iconType: "central_settlement",
    type: "location",
    unlocked: true,
  },
  {
    id: "northern_castle",
    titleKey: "worldMapNorthernCastleTitle",
    descriptionKey: "worldMapNorthernCastleDescription",
    x: 48.8,
    y: 21.1,
    icon: "K",
    iconType: "northern_castle",
    type: "location",
    unlocked: true,
  },
  {
    id: "southern_castle",
    titleKey: "worldMapSouthernCastleTitle",
    descriptionKey: "worldMapSouthernCastleDescription",
    x: 48.1,
    y: 77.9,
    icon: "K",
    iconType: "southern_castle",
    type: "location",
    unlocked: true,
  },
  {
    id: "cave_location",
    titleKey: "worldMapCaveLocationTitle",
    descriptionKey: "worldMapCaveLocationDescription",
    x: 71.6,
    y: 51.8,
    icon: "V",
    iconType: "cave",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "portal_location",
    titleKey: "worldMapPortalLocationTitle",
    descriptionKey: "worldMapPortalLocationDescription",
    x: 90.3,
    y: 82.3,
    icon: "P",
    iconType: "portal",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "necropolis_skull_castle",
    titleKey: "worldMapNecropolisSkullCastleTitle",
    descriptionKey: "worldMapNecropolisSkullCastleDescription",
    x: 81.2,
    y: 45.9,
    icon: "D",
    iconType: "necropolis",
    type: "danger_point",
    unlocked: false,
  },
  {
    id: "swamp_location",
    titleKey: "worldMapSwampLocationTitle",
    descriptionKey: "worldMapSwampLocationDescription",
    x: 83.7,
    y: 66.8,
    icon: "B",
    iconType: "swamp",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "waterfall_location",
    titleKey: "worldMapWaterfallLocationTitle",
    descriptionKey: "worldMapWaterfallLocationDescription",
    x: 67.0,
    y: 91.0,
    icon: "F",
    iconType: "waterfall",
    type: "location",
    unlocked: true,
  },
  {
    id: "volcanic_lava_location",
    titleKey: "worldMapVolcanicLavaLocationTitle",
    descriptionKey: "worldMapVolcanicLavaLocationDescription",
    x: 77.1,
    y: 18.1,
    icon: "L",
    iconType: "volcanic_lava",
    type: "danger_point",
    unlocked: false,
  },
  {
    id: "road_west_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 28.8,
    y: 75.7,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_west_02",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 36.2,
    y: 81.2,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_center_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 43.3,
    y: 63.9,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_center_north_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 46.2,
    y: 43.4,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_lake_crossing",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 37.7,
    y: 36.8,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_north_pass_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 54.8,
    y: 28.4,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_volcanic_01",
    titleKey: "worldMapDangerPointTitle",
    descriptionKey: "worldMapDangerPointDescription",
    x: 63.8,
    y: 19.8,
    icon: "",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "road_southwest_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 28.7,
    y: 76.1,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_southwest_02",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 37.9,
    y: 81.7,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_south_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 40.6,
    y: 91.0,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_southeast_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 54.2,
    y: 78.0,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_east_01",
    titleKey: "worldMapRoadPointTitle",
    descriptionKey: "worldMapRoadPointDescription",
    x: 57.4,
    y: 55.6,
    icon: "",
    iconType: "road_point",
    type: "road_point",
    unlocked: true,
  },
  {
    id: "road_dark_fork_01",
    titleKey: "worldMapDangerPointTitle",
    descriptionKey: "worldMapDangerPointDescription",
    x: 68.6,
    y: 51.8,
    icon: "",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "road_marsh_01",
    titleKey: "worldMapDangerPointTitle",
    descriptionKey: "worldMapDangerPointDescription",
    x: 70.5,
    y: 62.9,
    icon: "",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "road_marsh_02",
    titleKey: "worldMapDangerPointTitle",
    descriptionKey: "worldMapDangerPointDescription",
    x: 78.2,
    y: 71.8,
    icon: "",
    type: "danger_point",
    unlocked: true,
  },
];

export const worldMapRoutes: MapRoute[] = [
  { from: "western_great_city", to: "road_west_01", dangerLevel: 0, travelTimeHours: 2, energyCost: 1 },
  { from: "road_west_01", to: "road_west_02", dangerLevel: 0, travelTimeHours: 2, energyCost: 1 },
  { from: "road_west_02", to: "camp_location", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "camp_location", to: "central_settlement", dangerLevel: 0, travelTimeHours: 1, energyCost: 1 },
  { from: "camp_location", to: "road_center_01", dangerLevel: 0, travelTimeHours: 1, energyCost: 1 },
  { from: "road_center_01", to: "road_southwest_02", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "western_great_city", to: "road_southwest_01", dangerLevel: 0, travelTimeHours: 1, energyCost: 1 },
  { from: "road_southwest_01", to: "road_southwest_02", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_southwest_02", to: "road_south_01", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_south_01", to: "southern_castle", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "southern_castle", to: "road_southeast_01", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_southeast_01", to: "waterfall_location", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "central_settlement", to: "road_center_north_01", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_center_north_01", to: "northern_castle", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "northern_castle", to: "road_lake_crossing", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_lake_crossing", to: "northwest_winter_city", dangerLevel: 2, travelTimeHours: 3, energyCost: 2 },
  { from: "northern_castle", to: "road_north_pass_01", dangerLevel: 2, travelTimeHours: 3, energyCost: 2 },
  { from: "road_north_pass_01", to: "road_volcanic_01", dangerLevel: 3, travelTimeHours: 3, energyCost: 2 },
  { from: "road_volcanic_01", to: "volcanic_lava_location", dangerLevel: 4, travelTimeHours: 4, energyCost: 3 },
  { from: "central_settlement", to: "road_east_01", dangerLevel: 1, travelTimeHours: 2, energyCost: 1 },
  { from: "road_east_01", to: "road_dark_fork_01", dangerLevel: 2, travelTimeHours: 3, energyCost: 2 },
  { from: "road_dark_fork_01", to: "cave_location", dangerLevel: 2, travelTimeHours: 2, energyCost: 2 },
  { from: "cave_location", to: "necropolis_skull_castle", dangerLevel: 4, travelTimeHours: 4, energyCost: 3 },
  { from: "road_east_01", to: "road_marsh_01", dangerLevel: 2, travelTimeHours: 3, energyCost: 2 },
  { from: "road_marsh_01", to: "road_marsh_02", dangerLevel: 2, travelTimeHours: 3, energyCost: 2 },
  { from: "road_marsh_02", to: "swamp_location", dangerLevel: 3, travelTimeHours: 3, energyCost: 2 },
  { from: "swamp_location", to: "portal_location", dangerLevel: 4, travelTimeHours: 4, energyCost: 3 },
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

export function findPathBetweenNodes(startId: WorldMapNodeId, targetId: WorldMapNodeId) {
  if (startId === targetId) {
    return [startId];
  }

  const nodeIds = new Set(worldMapNodes.map((node) => node.id));

  if (!nodeIds.has(startId) || !nodeIds.has(targetId)) {
    return null;
  }

  const visited = new Set<WorldMapNodeId>([startId]);
  const queue: WorldMapNodeId[][] = [[startId]];

  while (queue.length > 0) {
    const path = queue.shift();

    if (!path) {
      break;
    }

    const currentId = path[path.length - 1];
    const connectedIds = getConnectedNodeIds(currentId);

    for (const connectedId of connectedIds) {
      if (visited.has(connectedId)) {
        continue;
      }

      const nextPath = [...path, connectedId];

      if (connectedId === targetId) {
        return nextPath;
      }

      visited.add(connectedId);
      queue.push(nextPath);
    }
  }

  return null;
}

export function getTravelPathCost(path: WorldMapNodeId[]) {
  return path.slice(0, -1).reduce((totalCost, nodeId, index) => {
    const nextNodeId = path[index + 1];
    const route = getRouteBetween(nodeId, nextNodeId);
    return totalCost + (route?.energyCost ?? 10);
  }, 0);
}

export function getTravelPathDangerLevel(path: WorldMapNodeId[]) {
  return path.slice(0, -1).reduce((dangerLevel, nodeId, index) => {
    const nextNodeId = path[index + 1];
    const route = getRouteBetween(nodeId, nextNodeId);
    return Math.max(dangerLevel, route?.dangerLevel ?? 0);
  }, 0);
}

export function getTravelPathTimeHours(path: WorldMapNodeId[]) {
  return path.slice(0, -1).reduce((totalHours, nodeId, index) => {
    const nextNodeId = path[index + 1];
    const route = getRouteBetween(nodeId, nextNodeId);
    return totalHours + (route?.travelTimeHours ?? 1);
  }, 0);
}

export function validateWorldMapData() {
  const warnings: string[] = [];
  const seenNodeIds = new Set<WorldMapNodeId>();
  const duplicateNodeIds = new Set<WorldMapNodeId>();

  for (const node of worldMapNodes) {
    if (seenNodeIds.has(node.id)) {
      duplicateNodeIds.add(node.id);
    }

    seenNodeIds.add(node.id);

    if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || node.x < 0 || node.x > 100 || node.y < 0 || node.y > 100) {
      warnings.push(`WorldMap node "${node.id}" has invalid coordinates: x=${node.x}, y=${node.y}.`);
    }

    if (node.type === "location" && !node.iconType) {
      warnings.push(`WorldMap location node "${node.id}" is missing iconType.`);
    }
  }

  for (const duplicateNodeId of duplicateNodeIds) {
    warnings.push(`WorldMap has duplicate node id "${duplicateNodeId}".`);
  }

  if (!seenNodeIds.has(WORLD_MAP_START_NODE_ID)) {
    warnings.push(`WorldMap start node "${WORLD_MAP_START_NODE_ID}" does not exist.`);
  }

  for (const route of worldMapRoutes) {
    if (!seenNodeIds.has(route.from)) {
      warnings.push(`WorldMap route points from missing node "${route.from}".`);
    }

    if (!seenNodeIds.has(route.to)) {
      warnings.push(`WorldMap route points to missing node "${route.to}".`);
    }

    if (!Number.isFinite(route.energyCost) || route.energyCost <= 0) {
      warnings.push(`WorldMap route "${route.from}" -> "${route.to}" has invalid energyCost.`);
    }

    if (!Number.isFinite(route.travelTimeHours) || route.travelTimeHours <= 0) {
      warnings.push(`WorldMap route "${route.from}" -> "${route.to}" has invalid travelTimeHours.`);
    }

    if (!Number.isFinite(route.dangerLevel) || route.dangerLevel < 0) {
      warnings.push(`WorldMap route "${route.from}" -> "${route.to}" has invalid dangerLevel.`);
    }
  }

  return warnings;
}

export function getConnectedNodeIds(id: WorldMapNodeId) {
  return worldMapRoutes
    .filter((route) => route.from === id || route.to === id)
    .map((route) => (route.from === id ? route.to : route.from));
}
