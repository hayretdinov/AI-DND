import { useMemo, useState } from "react";
import { getLocationEventById } from "../data/locationEvents";
import { getNpcById } from "../data/npcs";
import {
  SWAMP_MAP_IMAGE,
  swampMapLocations,
  type SwampMapLocation,
  type SwampMapMarkerType,
} from "../data/swampMap";
import { useLocationMapViewport } from "../hooks/useLocationMapViewport";
import { t, type TranslationKey } from "../i18n/i18n";
import { loadGame, saveGame } from "../systems/save/saveSystem";

type SwampMapSceneProps = {
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenWorldMap: () => void;
  onBackToMenu: () => void;
};

function getMarkerGlyph(markerType: SwampMapMarkerType) {
  const glyphs: Record<SwampMapMarkerType, string> = {
    entrance: "E",
    path: "P",
    ruin: "R",
    witch: "W",
    cult: "C",
    monster: "M",
    secret: "?",
    crypt: "K",
  };

  return glyphs[markerType];
}

function getLocationActionLabel(location: SwampMapLocation): TranslationKey {
  if (!location.eventId) {
    return "swamp.action.inspect";
  }

  if (location.markerType === "witch") {
    return "swamp.action.talk";
  }

  if (location.markerType === "monster" || location.markerType === "cult") {
    return "swamp.action.approach";
  }

  return "swamp.action.enter";
}

export function SwampMapScene({
  onOpenEvent,
  onOpenInventory,
  onOpenWorldMap,
  onBackToMenu,
}: SwampMapSceneProps) {
  const save = loadGame();
  const currentSwampLocationId = save?.swampState?.currentLocationId ?? "swamp_entrance";
  const currentLocation =
    swampMapLocations.find((location) => location.id === currentSwampLocationId) ?? swampMapLocations[0];
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocation.id);
  const selectedLocation = useMemo(
    () => swampMapLocations.find((location) => location.id === selectedLocationId) ?? currentLocation,
    [currentLocation, selectedLocationId],
  );
  const selectedEvent = selectedLocation.eventId ? getLocationEventById(selectedLocation.eventId) : null;
  const selectedNpc = selectedEvent?.npcId ? getNpcById(selectedEvent.npcId) : null;
  const mapViewport = useLocationMapViewport({
    focusPercent: {
      x: currentLocation.xPercent,
      y: currentLocation.yPercent,
    },
  });

  const openSelectedLocation = () => {
    const latestSave = loadGame();

    if (!latestSave) {
      return;
    }

    if (!selectedLocation.eventId || !selectedEvent) {
      saveGame({
        ...latestSave,
        currentLocationId: "swamp_location",
        swampState: {
          ...(latestSave.swampState ?? { discoveredLocationIds: [] }),
          currentLocationId: selectedLocation.id,
          discoveredLocationIds: Array.from(
            new Set([...(latestSave.swampState?.discoveredLocationIds ?? []), selectedLocation.id]),
          ),
        },
        navigationReturnContext: {
          screen: "swampMap",
          locationId: selectedLocation.id,
          eventId: selectedLocation.eventId,
        },
      });
      return;
    }

    saveGame({
      ...latestSave,
      currentLocationId: "swamp_location",
      activeEvent: {
        eventId: selectedEvent.id,
        npcId: selectedEvent.npcId,
        npcTemplateId: selectedEvent.npcId,
        npcInstanceId: selectedEvent.npcId,
        returnTo: "swampMap",
        swampLocationId: selectedLocation.id,
      },
      swampState: {
        ...(latestSave.swampState ?? { discoveredLocationIds: [] }),
        currentLocationId: selectedLocation.id,
        discoveredLocationIds: Array.from(
          new Set([...(latestSave.swampState?.discoveredLocationIds ?? []), selectedLocation.id]),
        ),
      },
      navigationReturnContext: {
        screen: "swampMap",
        locationId: selectedLocation.id,
        npcInstanceId: selectedEvent.npcId,
        eventId: selectedEvent.id,
      },
    });
    onOpenEvent();
  };

  const leaveSwamp = () => {
    const latestSave = loadGame();

    if (latestSave) {
      saveGame({
        ...latestSave,
        currentLocationId: "swamp_location",
        navigationReturnContext: {
          screen: "swampMap",
          locationId: currentLocation.id,
        },
      });
    }

    onOpenWorldMap();
  };

  return (
    <section className="swamp-map-scene" aria-label={t("swamp.mapTitle")}>
      <div
        ref={mapViewport.viewportRef}
        className={[
          "location-map-viewport",
          mapViewport.isDragging ? "location-map-viewport--dragging" : "",
        ].filter(Boolean).join(" ")}
        onPointerDown={mapViewport.handlePointerDown}
        onPointerMove={mapViewport.handlePointerMove}
        onPointerUp={mapViewport.handlePointerEnd}
        onPointerCancel={mapViewport.handlePointerEnd}
      >
        <div className="location-map-world" style={mapViewport.worldStyle}>
          <div className="swamp-map-background" aria-hidden="true">
            <img
              src={SWAMP_MAP_IMAGE}
              alt=""
              draggable={false}
              onLoad={mapViewport.handleImageLoad}
            />
          </div>
          <div className="swamp-map-fog" aria-hidden="true" />

          <div
            className="city-map-player-position swamp-map-player-position"
            style={{ left: `${currentLocation.xPercent}%`, top: `${currentLocation.yPercent}%` }}
            aria-label={t("city.currentPosition")}
          />

          {swampMapLocations.map((location) => {
            const isSelected = selectedLocationId === location.id;

            return (
              <button
                key={location.id}
                type="button"
                className={[
                  "city-map-location-marker",
                  "swamp-map-location-marker",
                  `swamp-map-location-marker--${location.markerType}`,
                  location.hidden ? "swamp-map-location-marker--hidden" : "",
                  isSelected ? "city-map-location-marker--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ left: `${location.xPercent}%`, top: `${location.yPercent}%` }}
                onClick={() => {
                  if (!mapViewport.consumeSuppressedMarkerClick()) {
                    setSelectedLocationId(location.id);
                  }
                }}
                aria-label={t(location.titleKey)}
              >
                <span>{getMarkerGlyph(location.markerType)}</span>
                <small>{t(location.titleKey)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <nav className="scene-top-navigation city-map-navigation swamp-map-navigation" aria-label={t("swamp.navigation")}>
        <button type="button" disabled>
          {t("swamp.mapTitle")}
        </button>
        <button type="button" onClick={onOpenInventory}>
          {t("city.inventory")}
        </button>
        <button type="button" onClick={leaveSwamp}>
          {t("city.worldMap")}
        </button>
        <button type="button" onClick={onBackToMenu}>
          {t("backToMenu")}
        </button>
      </nav>

      <div className="location-map-zoom-controls" aria-label="Map controls">
        <button type="button" onClick={mapViewport.zoomIn} aria-label="Zoom in">+</button>
        <button type="button" onClick={mapViewport.zoomOut} aria-label="Zoom out">-</button>
        <button type="button" onClick={mapViewport.resetView} aria-label="Center map">◎</button>
      </div>

      <aside className="city-map-info-panel swamp-map-info-panel">
        <p className="city-map-info-panel__eyebrow">{t("swamp.mapTitle")}</p>
        <h1>{t(selectedNpc?.nameKey ?? selectedLocation.titleKey)}</h1>
        <p>{selectedNpc ? t(selectedNpc.greetingKey) : t(selectedLocation.descriptionKey)}</p>
        {selectedLocation.hidden ? <p className="city-map-info-panel__warning">{t("swamp.hiddenHint")}</p> : null}
        <div className="city-map-info-panel__actions swamp-map-info-panel__actions">
          <button type="button" onClick={openSelectedLocation}>
            {t(getLocationActionLabel(selectedLocation))}
          </button>
          <button type="button" onClick={leaveSwamp}>
            {t("swamp.action.leave")}
          </button>
        </div>
      </aside>
    </section>
  );
}
