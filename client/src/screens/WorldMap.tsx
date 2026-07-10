import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";
import { t, type TranslationKey } from "../i18n/i18n";
import {
  getConnectedNodeIds,
  getRouteBetween,
  getTravelPathCost,
  getTravelPathDangerLevel,
  getTravelPathTimeHours,
  getWorldMapNodeById,
  isWorldMapNodeId,
  findPathBetweenNodes,
  validateWorldMapData,
  WORLD_MAP_START_NODE_ID,
  worldMapNodes,
  type MapNode,
  type WorldMapIconType,
  type WorldMapNodeId,
} from "../data/worldMap";
import { loadGame, saveGame } from "../systems/save/saveSystem";

type WorldMapProps = {
  saveVersion: number;
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onBackToMenu: () => void;
};

type NodeStatus = "current" | "available" | "locked" | "distant";
type ActiveTravelSegment = {
  fromId: WorldMapNodeId;
  toId: WorldMapNodeId;
};

const WORLD_MAP_ASSET_PATH = "/assets/world-map/world_map_main.png";
const WORLD_MAP_UI_PATH = "/assets/world-map/ui/";
const DEFAULT_TRAVEL_ENERGY_MAX = 100;
const DEFAULT_DAY = 1;
const DEFAULT_HOUR = 6;
const WALKING_SEGMENT_MIN_DELAY_MS = 15000;
const WALKING_SEGMENT_MAX_DELAY_MS = 60000;
const WALKING_DELAY_PER_TRAVEL_HOUR_MS = 5000;
const DEFAULT_SEGMENT_TRAVEL_TIME_HOURS = 1;
const DEFAULT_SEGMENT_ENERGY_COST = 10;
const BASE_TRAVEL_MODE = "walking";
const WALKING_SPEED_MULTIPLIER = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;
const DRAG_THRESHOLD_PX = 5;

const worldMapIconAssets: Record<WorldMapIconType, string> = {
  northwest_winter_city: "/assets/world-map/icons/northwest_winter_city.png",
  western_great_city: "/assets/world-map/icons/western_great_city.png",
  camp: "/assets/world-map/icons/camp_location.png",
  central_settlement: "/assets/world-map/icons/central_settlement.png",
  northern_castle: "/assets/world-map/icons/northern_castle.png",
  southern_castle: "/assets/world-map/icons/southern_castle.png",
  cave: "/assets/world-map/icons/cave_location.png",
  portal: "/assets/world-map/icons/portal_location.png",
  necropolis: "/assets/world-map/icons/necropolis_skull_castle.png",
  swamp: "/assets/world-map/icons/swamp_location.png",
  waterfall: "/assets/world-map/icons/waterfall_location.png",
  volcanic_lava: "/assets/world-map/icons/volcanic_lava_location.png",
  road_point: "/assets/world-map/icons/road_point_marker.png",
};

function translateMapKey(key: string) {
  return t(key as TranslationKey);
}

function getStatusClass(status: NodeStatus) {
  return status === "locked" || status === "distant" ? "unavailable" : status;
}

function getNodeStatus(
  node: MapNode,
  currentLocationId: WorldMapNodeId,
  connectedNodeIds: WorldMapNodeId[],
): NodeStatus {
  if (node.id === currentLocationId) {
    return "current";
  }

  if (!node.unlocked) {
    return "locked";
  }

  return connectedNodeIds.includes(node.id) ? "available" : "distant";
}

function getStatusLabel(status: NodeStatus) {
  if (status === "current") {
    return t("worldMapStatusCurrent");
  }

  if (status === "available") {
    return t("worldMapStatusAvailable");
  }

  if (status === "locked") {
    return t("worldMapStatusLocked");
  }

  return t("worldMapStatusDistant");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function advanceWorldTime(day: number, hour: number, addedHours: number) {
  const totalHours = hour + addedHours;
  return {
    day: day + Math.floor(totalHours / 24),
    hour: totalHours % 24,
  };
}

function getTravelVisualDelayMs(travelTimeHours?: number) {
  // TODO: reduce visualDelayMs with mounts, vehicles, ships, portals, and other travel speed modifiers.
  if (!Number.isFinite(travelTimeHours)) {
    return WALKING_SEGMENT_MIN_DELAY_MS;
  }

  const travelModeMultiplier = BASE_TRAVEL_MODE === "walking" ? WALKING_SPEED_MULTIPLIER : WALKING_SPEED_MULTIPLIER;
  return clamp(
    Number(travelTimeHours) * WALKING_DELAY_PER_TRAVEL_HOUR_MS * travelModeMultiplier,
    WALKING_SEGMENT_MIN_DELAY_MS,
    WALKING_SEGMENT_MAX_DELAY_MS,
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getSegmentEnergyCost(fromId: WorldMapNodeId, toId: WorldMapNodeId) {
  return getRouteBetween(fromId, toId)?.energyCost ?? DEFAULT_SEGMENT_ENERGY_COST;
}

function getSegmentTravelTimeHours(fromId: WorldMapNodeId, toId: WorldMapNodeId) {
  return getRouteBetween(fromId, toId)?.travelTimeHours ?? DEFAULT_SEGMENT_TRAVEL_TIME_HOURS;
}

function getTravelSegmentPoints(segment: ActiveTravelSegment | null) {
  if (!segment) {
    return [];
  }

  const fromNode = getWorldMapNodeById(segment.fromId);
  const toNode = getWorldMapNodeById(segment.toId);
  const route = getRouteBetween(segment.fromId, segment.toId);
  return [
    { x: fromNode.x, y: fromNode.y },
    ...(route?.pathPoints ?? []),
    { x: toNode.x, y: toNode.y },
  ];
}

export function WorldMap({
  saveVersion,
  onOpenEvent,
  onOpenInventory,
  onOpenJournal,
  onBackToMenu,
}: WorldMapProps) {
  void saveVersion;

  const save = loadGame();
  const savedLocationId = save?.currentLocationId;
  const initialLocationId = isWorldMapNodeId(savedLocationId)
    ? savedLocationId
    : WORLD_MAP_START_NODE_ID;
  const initialNode = getWorldMapNodeById(initialLocationId);
  const initialMaxEnergy = save?.travelEnergy?.maxEnergy ?? DEFAULT_TRAVEL_ENERGY_MAX;

  const [currentLocationId, setCurrentLocationId] = useState<WorldMapNodeId>(initialLocationId);
  const [selectedNodeId, setSelectedNodeId] = useState<WorldMapNodeId>(initialLocationId);
  const [markerPosition, setMarkerPosition] = useState({ x: initialNode.x, y: initialNode.y });
  const [travelingTo, setTravelingTo] = useState<WorldMapNodeId | null>(null);
  const [arrivalMessage, setArrivalMessage] = useState("");
  const [currentDay, setCurrentDay] = useState(save?.currentDay ?? DEFAULT_DAY);
  const [currentHour, setCurrentHour] = useState(save?.currentHour ?? DEFAULT_HOUR);
  const [travelEnergy, setTravelEnergy] = useState(save?.travelEnergy?.currentEnergy ?? initialMaxEnergy);
  const [travelEnergyMax, setTravelEnergyMax] = useState(initialMaxEnergy);
  const [travelPath, setTravelPath] = useState<WorldMapNodeId[]>([]);
  const [currentTravelStepIndex, setCurrentTravelStepIndex] = useState(0);
  const [activeTravelSegment, setActiveTravelSegment] = useState<ActiveTravelSegment | null>(null);
  const [activeTravelSegmentDelayMs, setActiveTravelSegmentDelayMs] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPlayerPortraitFailed, setIsPlayerPortraitFailed] = useState(false);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    hasDragged: false,
  });

  const connectedNodeIds = useMemo(() => getConnectedNodeIds(currentLocationId), [currentLocationId]);
  const worldMapDataWarnings = useMemo(() => validateWorldMapData(), []);
  const currentNode = getWorldMapNodeById(currentLocationId);
  const selectedNode = getWorldMapNodeById(selectedNodeId);
  const playerPortraitUrl = save?.player.portraitUrl ?? "";
  const playerInitial = save?.player.name.slice(0, 1).toUpperCase() || "?";
  const shouldShowPlayerPortrait = Boolean(playerPortraitUrl) && !isPlayerPortraitFailed;
  const selectedStatus = getNodeStatus(selectedNode, currentLocationId, connectedNodeIds);
  const activeTravelSegmentPoints = getTravelSegmentPoints(activeTravelSegment);
  const activeTravelSegmentLabel =
    activeTravelSegment === null
      ? ""
      : `${translateMapKey(getWorldMapNodeById(activeTravelSegment.fromId).titleKey)} -> ${translateMapKey(
          getWorldMapNodeById(activeTravelSegment.toId).titleKey,
        )}`;
  const playerMarkerStyle = {
    left: `${markerPosition.x}%`,
    top: `${markerPosition.y}%`,
    "--world-map-player-marker-travel-ms": `${activeTravelSegmentDelayMs}ms`,
  } as CSSProperties;
  const selectedPath = useMemo(
    () => findPathBetweenNodes(currentLocationId, selectedNodeId),
    [currentLocationId, selectedNodeId],
  );
  const selectedTravelCost = selectedPath ? getTravelPathCost(selectedPath) : null;
  const selectedPathDangerLevel = selectedPath ? getTravelPathDangerLevel(selectedPath) : null;
  const selectedTravelTimeHours = selectedPath ? getTravelPathTimeHours(selectedPath) : null;
  const hasPathToSelectedNode = Boolean(selectedPath);
  const hasEnoughTravelEnergy = selectedTravelCost === null || selectedTravelCost <= travelEnergy;
  const firstSegmentEnergyCost =
    selectedPath && selectedPath.length > 1 ? getSegmentEnergyCost(selectedPath[0], selectedPath[1]) : null;
  const hasEnoughEnergyForFirstSegment = firstSegmentEnergyCost === null || firstSegmentEnergyCost <= travelEnergy;
  const shouldShowNoEnergyWarning =
    hasPathToSelectedNode && selectedNodeId !== currentLocationId && !hasEnoughEnergyForFirstSegment;
  const shouldShowPartialEnergyWarning =
    hasPathToSelectedNode && !hasEnoughTravelEnergy && hasEnoughEnergyForFirstSegment;
  const canTravel = Boolean(
    save &&
      !travelingTo &&
      selectedNodeId !== currentLocationId &&
      selectedNode.unlocked &&
      selectedPath &&
      selectedPath.length > 1 &&
      hasEnoughEnergyForFirstSegment,
  );

  useEffect(() => {
    if (worldMapDataWarnings.length > 0) {
      console.warn("WorldMap data warnings:", worldMapDataWarnings);
    }
  }, [worldMapDataWarnings]);

  useEffect(() => {
    setIsPlayerPortraitFailed(false);
  }, [playerPortraitUrl]);

  useEffect(() => {
    if (!playerPortraitUrl) {
      console.warn("WorldMap player portraitUrl is missing. Visible fallback will be shown.");
    }
  }, [playerPortraitUrl]);

  const handlePlayerPortraitError = () => {
    if (!isPlayerPortraitFailed) {
      console.warn("WorldMap player portrait image failed to load. Visible fallback will be shown.", playerPortraitUrl);
    }

    setIsPlayerPortraitFailed(true);
  };

  const updateZoom = (nextZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
  };

  const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
  const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMapPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      hasDragged: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handleMapPointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!isDragging || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const movedDistance = Math.hypot(deltaX, deltaY);

    if (movedDistance > DRAG_THRESHOLD_PX) {
      dragState.hasDragged = true;
    }

    if (dragState.hasDragged) {
      setPan({ x: dragState.startPanX + deltaX, y: dragState.startPanY + deltaY });
    }
  };

  const handleMapPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    window.setTimeout(() => {
      dragStateRef.current.hasDragged = false;
    }, 0);
  };

  const handleMapWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault();
    updateZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  };

  const handleNodeSelect = (nodeId: WorldMapNodeId) => {
    if (travelingTo || dragStateRef.current.hasDragged) {
      return;
    }

    setSelectedNodeId(nodeId);
    setArrivalMessage("");
  };

  const handleNodePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    dragStateRef.current.hasDragged = false;
  };

  const handleNodeClick = (event: MouseEvent<HTMLButtonElement>, nodeId: WorldMapNodeId) => {
    event.stopPropagation();
    handleNodeSelect(nodeId);
  };

  const handleNodeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, nodeId: WorldMapNodeId) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handleNodeSelect(nodeId);
  };

  const handleTravel = async () => {
    if (!save || travelingTo || !selectedPath || selectedPath.length <= 1) {
      return;
    }

    setTravelingTo(selectedNodeId);
    setTravelPath(selectedPath);
    setCurrentTravelStepIndex(0);
    setArrivalMessage(t("worldMapTraveling"));

    let stepDay = currentDay;
    let stepHour = currentHour;
    let stepEnergy = travelEnergy;
    let stepMaxEnergy = travelEnergyMax;
    let lastReachedNodeId = currentLocationId;

    for (let index = 0; index < selectedPath.length - 1; index += 1) {
      const fromId = selectedPath[index];
      const toId = selectedPath[index + 1];
      const segmentEnergyCost = getSegmentEnergyCost(fromId, toId);
      const segmentTravelTimeHours = getSegmentTravelTimeHours(fromId, toId);
      const segmentVisualTimeHours = getRouteBetween(fromId, toId)?.travelTimeHours;

      if (stepEnergy < segmentEnergyCost) {
        setActiveTravelSegment(null);
        setArrivalMessage(t("worldMapTravelStoppedNoEnergy"));
        break;
      }

      const destination = getWorldMapNodeById(toId);
      const visualDelayMs = getTravelVisualDelayMs(segmentVisualTimeHours);
      setActiveTravelSegment({ fromId, toId });
      setActiveTravelSegmentDelayMs(visualDelayMs);
      setCurrentTravelStepIndex(index + 1);

      window.requestAnimationFrame(() => {
        setMarkerPosition({ x: destination.x, y: destination.y });
      });

      await wait(visualDelayMs);

      const latestSave = loadGame();
      const latestDay = latestSave?.currentDay ?? stepDay;
      const latestHour = latestSave?.currentHour ?? stepHour;
      const latestMaxEnergy = latestSave?.travelEnergy?.maxEnergy ?? stepMaxEnergy;
      const latestEnergy = latestSave?.travelEnergy?.currentEnergy ?? stepEnergy;
      const nextEnergy = Math.max(0, latestEnergy - segmentEnergyCost);
      const nextTime = advanceWorldTime(latestDay, latestHour, segmentTravelTimeHours);

      stepDay = nextTime.day;
      stepHour = nextTime.hour;
      stepEnergy = nextEnergy;
      stepMaxEnergy = latestMaxEnergy;
      lastReachedNodeId = toId;

      if (latestSave) {
        saveGame({
          ...latestSave,
          currentLocationId: toId,
          currentDay: nextTime.day,
          currentHour: nextTime.hour,
          travelEnergy: {
            currentEnergy: nextEnergy,
            maxEnergy: latestMaxEnergy,
            lastRestDay: latestSave.travelEnergy?.lastRestDay ?? latestDay,
          },
        });
      }

      setCurrentDay(nextTime.day);
      setCurrentHour(nextTime.hour);
      setTravelEnergy(nextEnergy);
      setTravelEnergyMax(latestMaxEnergy);
      setCurrentLocationId(toId);
    }

    const lastReachedNode = getWorldMapNodeById(lastReachedNodeId);
    const didReachTarget = lastReachedNodeId === selectedNodeId;
    setSelectedNodeId(didReachTarget ? lastReachedNodeId : selectedNodeId);
    setTravelingTo(null);
    setTravelPath([]);
    setCurrentTravelStepIndex(0);
    setActiveTravelSegment(null);
    setActiveTravelSegmentDelayMs(0);

    if (didReachTarget) {
      setArrivalMessage(
        getTravelPathDangerLevel(selectedPath) > 0
          ? `${t("worldMapArrived")} ${translateMapKey(lastReachedNode.titleKey)}. ${t("worldMapDangerNote")}`
          : `${t("worldMapArrived")} ${translateMapKey(lastReachedNode.titleKey)}.`,
      );
    }
  };

  return (
    <ScreenPanel title={t("worldMapTitle")} subtitle={t("worldMapSubtitle")} onBackToMenu={onBackToMenu}>
      {save ? (
        <div className="world-map-screen">
          <div className="world-map-ui-top" aria-label={t("worldMapTopPanel")}>
            <div>
              <span>{t("worldMapDay")}</span>
              <strong>{currentDay}</strong>
            </div>
            <div>
              <span>{t("worldMapHour")}</span>
              <strong>{formatHour(currentHour)}</strong>
            </div>
            <div>
              <span>{t("worldMapTravelEnergy")}</span>
              <strong>
                {travelEnergy}/{travelEnergyMax}
              </strong>
            </div>
          </div>

          <nav className="world-map-ui-left" aria-label={t("worldMapNavigation")}>
            <div
              className="world-map-player-portrait player-portrait-frame"
              aria-label={t("worldMapPlayerPortrait")}
            >
              {shouldShowPlayerPortrait ? (
                <img
                  className="world-map-player-portrait-image player-portrait-frame__image"
                  src={playerPortraitUrl}
                  alt=""
                  onError={handlePlayerPortraitError}
                />
              ) : null}
              <span
                className="world-map-player-portrait-fallback player-portrait-frame__fallback"
                aria-label={t("worldMapPortraitMissing")}
              >
                {playerInitial}
              </span>
              <img
                className="world-map-player-portrait-frame player-portrait-frame__frame"
                src={`${WORLD_MAP_UI_PATH}player_portrait_frame.png`}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </div>
            <button type="button" className="world-map-nav-button world-map-nav-button--active">
              <span className="map-fallback-icon">M</span>
              <span>{t("worldMapTitle")}</span>
            </button>
            <button type="button" className="world-map-nav-button" onClick={onOpenInventory}>
              <img
                src={`${WORLD_MAP_UI_PATH}inventory_icon.png`}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <span>{t("inventoryTitle")}</span>
            </button>
            <button type="button" className="world-map-nav-button" onClick={onOpenJournal}>
              <img
                src={`${WORLD_MAP_UI_PATH}messages_icon.png`}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <span>{t("journalTitle")}</span>
            </button>
            <button type="button" className="world-map-nav-button" disabled>
              <img
                src={`${WORLD_MAP_UI_PATH}settings_icon.png`}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <span>{t("settingsTitle")}</span>
            </button>
          </nav>

          <section
            className={["world-map-viewport", isDragging ? "world-map-viewport--dragging" : ""]
              .filter(Boolean)
              .join(" ")}
            aria-label={t("worldMapTitle")}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerEnd}
            onPointerCancel={handleMapPointerEnd}
            onPointerLeave={handleMapPointerEnd}
            onWheel={handleMapWheel}
          >
            <div
              className="world-map-canvas"
              style={{
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              }}
            >
              <div className="world-map-background" aria-hidden="true">
                <img
                  src={WORLD_MAP_ASSET_PATH}
                  alt=""
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
              <div className="world-map-board__mist" aria-hidden="true" />

              {travelingTo && activeTravelSegment && activeTravelSegmentPoints.length > 1 ? (
                <svg
                  className="world-map-travel-arrow-layer"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="world-map-travel-arrow-head"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path className="world-map-travel-arrow-head" d="M 0 0 L 8 4 L 0 8 z" />
                    </marker>
                  </defs>
                  <polyline
                    className="world-map-travel-arrow-path"
                    points={activeTravelSegmentPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    markerEnd="url(#world-map-travel-arrow-head)"
                  />
                </svg>
              ) : null}

              {worldMapNodes.map((node) => {
                const status = getNodeStatus(node, currentLocationId, connectedNodeIds);
                const statusClass = getStatusClass(status);
                const isSelected = node.id === selectedNodeId;
                const title = translateMapKey(node.titleKey);
                const hasMapIcon = Boolean(node.iconType);
                const isRoadPointIcon = node.iconType === "road_point";
                const markerClassName = isRoadPointIcon
                  ? "world-map-road-point-icon"
                  : hasMapIcon
                    ? "world-map-icon"
                    : "world-map-road-marker";

                return (
                  <button
                    key={node.id}
                    type="button"
                    className={[
                      "world-map-node",
                      `world-map-node--${node.type}`,
                      `world-map-node--${statusClass}`,
                      node.type === "road_point" ? "world-map-node--road-point" : "",
                      !hasMapIcon || isRoadPointIcon ? "world-map-node--minor" : "",
                      isSelected ? "world-map-node--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    role="button"
                    tabIndex={0}
                    onPointerDown={handleNodePointerDown}
                    onClick={(event) => handleNodeClick(event, node.id)}
                    onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
                    aria-label={`${title}: ${getStatusLabel(status)}`}
                    aria-disabled={Boolean(travelingTo)}
                  >
                    <span className={markerClassName}>
                      {node.iconType ? (
                        <img
                          src={worldMapIconAssets[node.iconType]}
                          alt=""
                          draggable={false}
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      ) : null}
                      {hasMapIcon && !isRoadPointIcon ? <span className="map-fallback-icon">{node.icon}</span> : null}
                    </span>
                    <span className="world-map-node__label">{title}</span>
                  </button>
                );
              })}

              <div
                className={["world-map-player-marker", travelingTo ? "world-map-player-marker--traveling" : ""]
                  .filter(Boolean)
                  .join(" ")}
                style={playerMarkerStyle}
                aria-label={t("worldMapPlayerMarker")}
              >
                <span className="world-map-player-marker-ring" aria-hidden="true" />
                {shouldShowPlayerPortrait ? (
                  <img
                    className="world-map-player-marker-image"
                    src={playerPortraitUrl}
                    alt=""
                    draggable={false}
                    onError={handlePlayerPortraitError}
                  />
                ) : null}
                <span className="world-map-player-marker-fallback">{playerInitial}</span>
              </div>
            </div>
          </section>

          <div className="world-map-zoom-controls" aria-label={t("worldMapZoomControls")}>
            <button type="button" onClick={handleZoomIn} aria-label={t("worldMapZoomIn")}>
              +
            </button>
            <button type="button" onClick={handleZoomOut} aria-label={t("worldMapZoomOut")}>
              -
            </button>
            <button type="button" onClick={handleResetView} aria-label={t("worldMapZoomReset")}>
              {t("worldMapZoomReset")}
            </button>
          </div>

          <aside className="world-map-ui-right" aria-live="polite">
            <p className="world-map-info__eyebrow">{t("traveler")}</p>
            <h2>{save.player.name}</h2>
            <div className="world-map-info__current">
              <span>{t("worldMapCurrentLocation")}</span>
              <strong>{translateMapKey(currentNode.titleKey)}</strong>
            </div>

            <div className="world-map-info__location">
              <p className="world-map-info__eyebrow">{t("worldMapSelectedLocation")}</p>
              <h3>{translateMapKey(selectedNode.titleKey)}</h3>
              <p>{translateMapKey(selectedNode.descriptionKey)}</p>
              <dl>
                <div>
                  <dt>{t("worldMapLocationStatus")}</dt>
                  <dd>{getStatusLabel(selectedStatus)}</dd>
                </div>
                <div>
                  <dt>{t("worldMapDangerLevel")}</dt>
                  <dd>{selectedPathDangerLevel ?? "-"}</dd>
                </div>
                <div>
                  <dt>{t("worldMapTravelCost")}</dt>
                  <dd>{selectedTravelCost ?? "-"}</dd>
                </div>
                <div>
                  <dt>{t("worldMapTravelTime")}</dt>
                  <dd>{selectedTravelTimeHours ?? "-"}</dd>
                </div>
                {travelingTo && travelPath.length > 1 ? (
                  <>
                    {activeTravelSegment ? (
                      <div>
                        <dt>{t("worldMapTravelSegment")}</dt>
                        <dd>{activeTravelSegmentLabel}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>{t("worldMapPathProgress")}</dt>
                      <dd>
                        {currentTravelStepIndex}/{travelPath.length - 1}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("worldMapMovingToNextPoint")}</dt>
                      <dd>
                        {translateMapKey(
                          getWorldMapNodeById(
                            travelPath[Math.min(currentTravelStepIndex, travelPath.length - 1)],
                          ).titleKey,
                        )}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>

            {!hasPathToSelectedNode ? (
              <p className="world-map-info__warning">{t("worldMapPathNotFound")}</p>
            ) : null}
            {shouldShowNoEnergyWarning ? (
              <p className="world-map-info__warning">{t("worldMapNotEnoughEnergy")}</p>
            ) : null}
            {shouldShowPartialEnergyWarning ? (
              <p className="world-map-info__warning">{t("worldMapPartialEnergyWarning")}</p>
            ) : null}
            {arrivalMessage ? <p className="world-map-info__arrival">{arrivalMessage}</p> : null}
          </aside>

          <div className="world-map-ui-bottom">
            <div>
              <span>{t("worldMapCurrentLocation")}</span>
              <strong>{translateMapKey(currentNode.titleKey)}</strong>
            </div>
            {selectedStatus === "current" ? (
              <p className="world-map-info__here">{t("worldMapYouAreHere")}</p>
            ) : (
              <FantasyButton onClick={handleTravel} disabled={!canTravel} variant="primary">
                {travelingTo ? t("worldMapTraveling") : t("worldMapTravel")}
              </FantasyButton>
            )}
            <FantasyButton onClick={onOpenEvent}>{t("worldMapCampRest")}</FantasyButton>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>{t("noSavedTraveler")}</p>
          <FantasyButton onClick={onBackToMenu}>{t("backToMenu")}</FantasyButton>
        </div>
      )}
    </ScreenPanel>
  );
}
