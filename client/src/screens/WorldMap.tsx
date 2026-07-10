import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";
import { t, type TranslationKey } from "../i18n/i18n";
import {
  getConnectedNodeIds,
  getTravelPathCost,
  getTravelPathDangerLevel,
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

const MOVE_DURATION_MS = 900;
const WORLD_MAP_ASSET_PATH = "/assets/world-map/world_map_main.png";
const WORLD_MAP_UI_PATH = "/assets/world-map/ui/";
const TRAVEL_ENERGY_MAX = 3;
const CURRENT_DAY = 1;
const CURRENT_HOUR = "06:00";
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

  const [currentLocationId, setCurrentLocationId] = useState<WorldMapNodeId>(initialLocationId);
  const [selectedNodeId, setSelectedNodeId] = useState<WorldMapNodeId>(initialLocationId);
  const [markerPosition, setMarkerPosition] = useState({ x: initialNode.x, y: initialNode.y });
  const [travelingTo, setTravelingTo] = useState<WorldMapNodeId | null>(null);
  const [arrivalMessage, setArrivalMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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
  const selectedStatus = getNodeStatus(selectedNode, currentLocationId, connectedNodeIds);
  const selectedPath = useMemo(
    () => findPathBetweenNodes(currentLocationId, selectedNodeId),
    [currentLocationId, selectedNodeId],
  );
  const travelEnergy = TRAVEL_ENERGY_MAX;
  const selectedTravelCost = selectedPath ? getTravelPathCost(selectedPath) : null;
  const selectedPathDangerLevel = selectedPath ? getTravelPathDangerLevel(selectedPath) : null;
  const hasPathToSelectedNode = Boolean(selectedPath);
  const hasEnoughTravelEnergy = selectedTravelCost === null || selectedTravelCost <= travelEnergy;
  const canTravel = Boolean(
    save &&
      !travelingTo &&
      selectedNodeId !== currentLocationId &&
      selectedNode.unlocked &&
      selectedPath &&
      hasEnoughTravelEnergy,
  );

  useEffect(() => {
    if (worldMapDataWarnings.length > 0) {
      console.warn("WorldMap data warnings:", worldMapDataWarnings);
    }
  }, [worldMapDataWarnings]);

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

  const handleTravel = () => {
    if (!save || !canTravel || !selectedPath) {
      return;
    }

    const destination = getWorldMapNodeById(selectedNodeId);
    setTravelingTo(selectedNodeId);
    setArrivalMessage(t("worldMapTraveling"));

    window.requestAnimationFrame(() => {
      setMarkerPosition({ x: destination.x, y: destination.y });
    });

    window.setTimeout(() => {
      const latestSave = loadGame();

      if (latestSave) {
        saveGame({ ...latestSave, currentLocationId: destination.id });
      }

      setCurrentLocationId(destination.id);
      setSelectedNodeId(destination.id);
      setTravelingTo(null);
      setArrivalMessage(
        getTravelPathDangerLevel(selectedPath) > 0
          ? `${t("worldMapArrived")} ${translateMapKey(destination.titleKey)}. ${t("worldMapDangerNote")}`
          : `${t("worldMapArrived")} ${translateMapKey(destination.titleKey)}.`,
      );
    }, MOVE_DURATION_MS);
  };

  return (
    <ScreenPanel title={t("worldMapTitle")} subtitle={t("worldMapSubtitle")} onBackToMenu={onBackToMenu}>
      {save ? (
        <div className="world-map-screen">
          <div className="world-map-ui-top" aria-label={t("worldMapTopPanel")}>
            <div>
              <span>{t("worldMapDay")}</span>
              <strong>{CURRENT_DAY}</strong>
            </div>
            <div>
              <span>{t("worldMapHour")}</span>
              <strong>{CURRENT_HOUR}</strong>
            </div>
            <div>
              <span>{t("worldMapTravelEnergy")}</span>
              <strong>
                {travelEnergy}/{TRAVEL_ENERGY_MAX}
              </strong>
            </div>
          </div>

          <nav className="world-map-ui-left" aria-label={t("worldMapNavigation")}>
            <div className="player-portrait-frame" aria-label={save.player.name}>
              <img
                src={`${WORLD_MAP_UI_PATH}player_portrait_frame.png`}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <span>{save.player.name.slice(0, 1).toUpperCase()}</span>
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
                style={{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }}
                aria-label={t("worldMapPlayerMarker")}
              >
                <span />
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
              </dl>
            </div>

            {!hasPathToSelectedNode ? (
              <p className="world-map-info__warning">{t("worldMapPathNotFound")}</p>
            ) : null}
            {hasPathToSelectedNode && !hasEnoughTravelEnergy ? (
              <p className="world-map-info__warning">{t("worldMapNotEnoughEnergy")}</p>
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
