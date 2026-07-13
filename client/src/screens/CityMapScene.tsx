import { useMemo, useState } from "react";
import {
  WESTERN_GREAT_CITY_ID,
  cityMapDefinitions,
  getCityMapLocations,
  getCityMapNpcEventId,
  getCityMapNpcPlacements,
} from "../data/cityMap";
import { getLocationEventById } from "../data/locationEvents";
import { getNpcById } from "../data/npcs";
import { t, type TranslationKey } from "../i18n/i18n";
import { loadGame, saveGame } from "../systems/save/saveSystem";
import type { CityId, CityMapLocation, CityMapNpcPlacement } from "../types/city";

type CityMapSceneProps = {
  cityId?: CityId;
  onOpenEvent: () => void;
  onOpenInventory: () => void;
  onOpenWorldMap: () => void;
  onBackToMenu: () => void;
};

function getLocationStatus(location: CityMapLocation, discoveredLocationIds: string[]) {
  if (location.locked) {
    return "locked";
  }

  if (location.initiallyDiscovered || discoveredLocationIds.includes(location.id)) {
    return "known";
  }

  return "unknown";
}

function getMarkerGlyph(markerType: CityMapLocation["markerType"]) {
  const glyphs: Record<CityMapLocation["markerType"], string> = {
    palace: "P",
    temple: "T",
    archive: "A",
    military: "M",
    market: "R",
    guild: "G",
    gate: "W",
    district: "D",
  };

  return glyphs[markerType];
}

export function CityMapScene({
  cityId,
  onOpenEvent,
  onOpenInventory,
  onOpenWorldMap,
  onBackToMenu,
}: CityMapSceneProps) {
  const save = loadGame();
  const resolvedCityId = cityId ?? save?.cityState?.currentCityId ?? WESTERN_GREAT_CITY_ID;
  const cityDefinition = cityMapDefinitions[resolvedCityId];
  const cityState = save?.cityState;
  const discoveredLocationIds = cityState?.discoveredLocationIds ?? [];
  const currentLocationId = cityState?.currentCityId === resolvedCityId
    ? cityState.currentCityLocationId ?? cityDefinition.defaultLocationId
    : cityDefinition.defaultLocationId;
  const locations = useMemo(() => getCityMapLocations(resolvedCityId), [resolvedCityId]);
  const npcPlacements = useMemo(() => getCityMapNpcPlacements(resolvedCityId), [resolvedCityId]);
  const currentLocation = locations.find((location) => location.id === currentLocationId) ?? locations[0];
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocation?.id ?? cityDefinition.defaultLocationId);
  const [selectedNpcId, setSelectedNpcId] = useState("");
  const [noticeKey, setNoticeKey] = useState<TranslationKey | "">("");
  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? currentLocation;
  const selectedNpcPlacement = npcPlacements.find((placement) => placement.npcInstanceId === selectedNpcId);
  const selectedNpc = selectedNpcPlacement ? getNpcById(selectedNpcPlacement.npcInstanceId) : null;
  const playerLocation = locations.find((location) => location.id === currentLocationId) ?? currentLocation;

  const openNpc = (placement: CityMapNpcPlacement) => {
    const latestSave = loadGame();
    const npc = getNpcById(placement.npcInstanceId);
    const eventId = getCityMapNpcEventId(placement.npcInstanceId);
    const event = getLocationEventById(eventId);

    setSelectedNpcId(placement.npcInstanceId);

    if (!latestSave || !npc || !event) {
      setNoticeKey("city.locationUnavailable");
      return;
    }

    if (!placement.available) {
      setNoticeKey(placement.unavailableReasonKey ?? "city.locationUnavailable");
      return;
    }

    saveGame({
      ...latestSave,
      activeEvent: {
        eventId,
        npcId: npc.id,
        npcTemplateId: npc.id,
        npcInstanceId: npc.id,
        returnTo: "cityMap",
        cityId: resolvedCityId,
        cityLocationId: placement.locationId,
      },
      cityState: {
        ...(latestSave.cityState ?? { discoveredLocationIds: [] }),
        currentCityId: resolvedCityId,
        currentCityLocationId: placement.locationId,
        lastVisitedNpcId: npc.id,
        discoveredLocationIds: Array.from(
          new Set([...(latestSave.cityState?.discoveredLocationIds ?? []), placement.locationId]),
        ),
      },
      navigationReturnContext: {
        screen: npc.role === "merchant" ? "merchantScene" : "eventScene",
        cityId: resolvedCityId,
        locationId: placement.locationId,
        npcInstanceId: npc.id,
        eventId,
      },
    });
    onOpenEvent();
  };

  const selectLocation = (location: CityMapLocation) => {
    setSelectedLocationId(location.id);
    setSelectedNpcId("");

    const status = getLocationStatus(location, discoveredLocationIds);
    if (status === "locked") {
      setNoticeKey(location.unavailableReasonKey ?? "city.locationUnavailable");
      return;
    }

    setNoticeKey("");
  };

  const leaveCity = () => {
    const latestSave = loadGame();

    if (latestSave) {
      saveGame({
        ...latestSave,
        cityState: {
          ...(latestSave.cityState ?? { discoveredLocationIds: [] }),
          currentCityId: resolvedCityId,
          currentCityLocationId: cityDefinition.exitLocationId,
          discoveredLocationIds: latestSave.cityState?.discoveredLocationIds ?? [cityDefinition.exitLocationId],
        },
        navigationReturnContext: {
          screen: "cityMap",
          cityId: resolvedCityId,
          locationId: cityDefinition.exitLocationId,
        },
      });
    }

    onOpenWorldMap();
  };

  return (
    <section className="city-map-scene" aria-label={t("city.cityMap")}>
      <div className="city-map-background" aria-hidden="true">
        <img src={cityDefinition.image} alt="" draggable={false} />
      </div>
      <div className="city-map-vignette" aria-hidden="true" />

      <nav className="scene-top-navigation city-map-navigation" aria-label={t("city.navigation")}>
        <button type="button" className="scene-nav-city-map" disabled>
          {t("city.cityMap")}
        </button>
        <button type="button" className="scene-nav-inventory" onClick={onOpenInventory}>
          {t("city.inventory")}
        </button>
        <button type="button" className="scene-nav-world-map" onClick={leaveCity}>
          {t("city.worldMap")}
        </button>
        <button type="button" onClick={onBackToMenu}>
          {t("backToMenu")}
        </button>
      </nav>

      <div
        className="city-map-player-position"
        style={{ left: `${playerLocation?.xPercent ?? 50}%`, top: `${playerLocation?.yPercent ?? 50}%` }}
        aria-label={t("city.currentPosition")}
      />

      {locations.map((location) => {
        const status = getLocationStatus(location, discoveredLocationIds);
        const isSelected = selectedLocationId === location.id;

        return (
          <button
            key={location.id}
            type="button"
            className={[
              "city-map-location-marker",
              `city-map-location-marker--${location.markerType}`,
              status === "locked" ? "city-map-location-marker--unavailable" : "",
              isSelected ? "city-map-location-marker--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: `${location.xPercent}%`, top: `${location.yPercent}%` }}
            onClick={() => selectLocation(location)}
            aria-label={t(location.titleKey)}
          >
            <span>{getMarkerGlyph(location.markerType)}</span>
            <small>{t(location.titleKey)}</small>
          </button>
        );
      })}

      {npcPlacements.map((placement) => {
        const npc = getNpcById(placement.npcInstanceId);

        if (!npc) {
          return null;
        }

        return (
          <button
            key={placement.npcInstanceId}
            type="button"
            className={[
              "city-map-npc-marker",
              placement.available ? "" : "city-map-npc-marker--unavailable",
              selectedNpcId === placement.npcInstanceId ? "city-map-npc-marker--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: `${placement.xPercent}%`, top: `${placement.yPercent}%` }}
            onClick={() => openNpc(placement)}
            aria-label={t(npc.nameKey)}
          >
            {placement.portraitUrl ? <img src={placement.portraitUrl} alt="" draggable={false} /> : null}
            <span>{t(npc.nameKey).slice(0, 1)}</span>
          </button>
        );
      })}

      <aside className="city-map-info-panel">
        <p className="city-map-info-panel__eyebrow">{t(cityDefinition.titleKey)}</p>
        <h1>{t(selectedNpc?.nameKey ?? selectedLocation?.titleKey ?? "city.cityMap")}</h1>
        <p>
          {selectedNpc
            ? t(selectedNpc.titleKey ?? selectedNpc.greetingKey)
            : t(selectedLocation?.descriptionKey ?? "city.mapDescription")}
        </p>
        {selectedNpcPlacement && !selectedNpcPlacement.available ? (
          <p className="city-map-info-panel__warning">
            {t(selectedNpcPlacement.unavailableReasonKey ?? "city.locationUnavailable")}
          </p>
        ) : null}
        {noticeKey ? <p className="city-map-info-panel__warning">{t(noticeKey)}</p> : null}
        <div className="city-map-info-panel__actions">
          <button type="button" onClick={leaveCity}>
            {t("city.returnToRoad")}
          </button>
        </div>
      </aside>
    </section>
  );
}
