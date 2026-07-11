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
  | "volcanic_lava_location";

export type WorldMapNodeType = "location" | "danger_point" | "camp_point";

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
  iconType?: WorldMapIconType;
  type: WorldMapNodeType;
  unlocked: boolean;
  enterEventId?: "anariel_intro";
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
    x: 48.8,
    y: 65.5,
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
    y: 92.8,
    icon: "K",
    iconType: "southern_castle",
    type: "location",
    unlocked: true,
  },
  {
    id: "cave_location",
    titleKey: "worldMapCaveLocationTitle",
    descriptionKey: "worldMapCaveLocationDescription",
    x: 97.7,
    y: 40.8,
    icon: "V",
    iconType: "cave",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "portal_location",
    titleKey: "worldMapPortalLocationTitle",
    descriptionKey: "worldMapPortalLocationDescription",
    x: 96.1,
    y: 87.2,
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
    unlocked: true,
    enterEventId: "anariel_intro",
  },
  {
    id: "swamp_location",
    titleKey: "worldMapSwampLocationTitle",
    descriptionKey: "worldMapSwampLocationDescription",
    x: 72.3,
    y: 64.2,
    icon: "B",
    iconType: "swamp",
    type: "danger_point",
    unlocked: true,
  },
  {
    id: "waterfall_location",
    titleKey: "worldMapWaterfallLocationTitle",
    descriptionKey: "worldMapWaterfallLocationDescription",
    x: 60.5,
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
    unlocked: true,
  },
];

export const worldMapRoutes: MapRoute[] = [
  { from: "western_great_city", to: "camp_location", dangerLevel: 1, travelTimeHours: 6, energyCost: 8 },
  { from: "western_great_city", to: "central_settlement", dangerLevel: 1, travelTimeHours: 8, energyCost: 12 },
  { from: "camp_location", to: "central_settlement", dangerLevel: 0, travelTimeHours: 3, energyCost: 5 },
  { from: "central_settlement", to: "northern_castle", dangerLevel: 1, travelTimeHours: 7, energyCost: 16 },
  { from: "central_settlement", to: "southern_castle", dangerLevel: 1, travelTimeHours: 8, energyCost: 18 },
  { from: "central_settlement", to: "swamp_location", dangerLevel: 2, travelTimeHours: 8, energyCost: 22 },
  { from: "northern_castle", to: "northwest_winter_city", dangerLevel: 2, travelTimeHours: 7, energyCost: 18 },
  { from: "northern_castle", to: "volcanic_lava_location", dangerLevel: 4, travelTimeHours: 8, energyCost: 26 },
  { from: "northern_castle", to: "portal_location", dangerLevel: 3, travelTimeHours: 10, energyCost: 28 },
  { from: "southern_castle", to: "waterfall_location", dangerLevel: 1, travelTimeHours: 4, energyCost: 10 },
  { from: "swamp_location", to: "necropolis_skull_castle", dangerLevel: 4, travelTimeHours: 6, energyCost: 18 },
  { from: "swamp_location", to: "portal_location", dangerLevel: 4, travelTimeHours: 5, energyCost: 18 },
  { from: "necropolis_skull_castle", to: "cave_location", dangerLevel: 4, travelTimeHours: 5, energyCost: 16 },
  { from: "necropolis_skull_castle", to: "volcanic_lava_location", dangerLevel: 4, travelTimeHours: 9, energyCost: 28 },
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
