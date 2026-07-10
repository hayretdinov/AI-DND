import { useMemo, useState } from "react";
import { ScreenPanel } from "../components/ScreenPanel";
import { FantasyButton } from "../components/FantasyButton";
import { t, type TranslationKey } from "../i18n/i18n";
import {
  getConnectedNodeIds,
  getRouteBetween,
  getWorldMapNodeById,
  isWorldMapNodeId,
  WORLD_MAP_START_NODE_ID,
  worldMapNodes,
  worldMapRoutes,
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
};

function translateMapKey(key: string) {
  return t(key as TranslationKey);
}

function getStatusClass(status: NodeStatus) {
  return status === "locked" || status === "distant" ? "unavailable" : status;
}

function getTravelCost(dangerLevel?: number) {
  return dangerLevel === undefined ? 0 : Math.max(1, dangerLevel + 1);
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

  const connectedNodeIds = useMemo(() => getConnectedNodeIds(currentLocationId), [currentLocationId]);
  const currentNode = getWorldMapNodeById(currentLocationId);
  const selectedNode = getWorldMapNodeById(selectedNodeId);
  const selectedStatus = getNodeStatus(selectedNode, currentLocationId, connectedNodeIds);
  const selectedRoute = getRouteBetween(currentLocationId, selectedNodeId);
  const travelEnergy = TRAVEL_ENERGY_MAX;
  const selectedTravelCost = getTravelCost(selectedRoute?.dangerLevel);
  const hasEnoughTravelEnergy = selectedTravelCost === 0 || selectedTravelCost <= travelEnergy;
  const canTravel = Boolean(
    save &&
      !travelingTo &&
      selectedNodeId !== currentLocationId &&
      selectedNode.unlocked &&
      selectedRoute &&
      hasEnoughTravelEnergy,
  );

  const handleNodeSelect = (nodeId: WorldMapNodeId) => {
    if (travelingTo) {
      return;
    }

    setSelectedNodeId(nodeId);
    setArrivalMessage("");
  };

  const handleTravel = () => {
    if (!save || !canTravel || !selectedRoute) {
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
        selectedRoute.dangerLevel > 0
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

          <section className="world-map-layout" aria-label={t("worldMapTitle")}>
            <div className="world-map-background" aria-hidden="true">
              <img
                src={WORLD_MAP_ASSET_PATH}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </div>
            <div className="world-map-board__mist" aria-hidden="true" />
            <svg className="world-map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {worldMapRoutes.map((route) => {
                const from = getWorldMapNodeById(route.from);
                const to = getWorldMapNodeById(route.to);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2 - 5;
                const isCurrentRoute = route.from === currentLocationId || route.to === currentLocationId;
                const isLockedRoute = !from.unlocked || !to.unlocked;

                return (
                  <path
                    key={`${route.from}-${route.to}`}
                    className={[
                      "world-map-route",
                      isCurrentRoute ? "world-map-route--current" : "",
                      isLockedRoute ? "world-map-route--locked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  />
                );
              })}
            </svg>

            {worldMapNodes.map((node) => {
              const status = getNodeStatus(node, currentLocationId, connectedNodeIds);
              const statusClass = getStatusClass(status);
              const isSelected = node.id === selectedNodeId;
              const title = translateMapKey(node.titleKey);

              return (
                <button
                  key={node.id}
                  type="button"
                  className={[
                    "world-map-node",
                    `world-map-node--${node.type}`,
                    `world-map-node--${statusClass}`,
                    isSelected ? "world-map-node--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => handleNodeSelect(node.id)}
                  aria-label={`${title}: ${getStatusLabel(status)}`}
                  aria-disabled={Boolean(travelingTo)}
                >
                  <span className="world-map-icon">
                    <img
                      src={worldMapIconAssets[node.iconType]}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                    <span className="map-fallback-icon">{node.icon}</span>
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
          </section>

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
                  <dd>{selectedRoute ? selectedRoute.dangerLevel : "-"}</dd>
                </div>
                <div>
                  <dt>{t("worldMapTravelCost")}</dt>
                  <dd>{selectedRoute ? selectedTravelCost : "-"}</dd>
                </div>
              </dl>
            </div>

            {!hasEnoughTravelEnergy ? (
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
