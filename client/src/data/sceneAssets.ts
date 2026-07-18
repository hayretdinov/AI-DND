export type NpcSceneMode = "dialogue" | "merchant" | "gate";

export type NpcSceneDefinition = {
  npcInstanceId: string;
  settlementId?: string;
  locationId: string;
  sceneMode: NpcSceneMode;
  backgroundUrl: string;
  characterImageUrl?: string;
  characterPosition?: {
    xPercent: number;
    yPercent: number;
    scale: number;
  };
};

export const LOCATION_BACKGROUND_PATH = "/assets/locations/";
export const MERCHANT_BACKGROUND_PATH = "/assets/backgrounds/merchants/";

export const sceneAssetDefinitions: Record<string, NpcSceneDefinition> = {
  merchant_central_settlement: {
    npcInstanceId: "merchant_central_settlement",
    settlementId: "central_settlement",
    locationId: "central_settlement",
    sceneMode: "merchant",
    backgroundUrl: `${MERCHANT_BACKGROUND_PATH}central_settlement_merchant_background.png`,
    characterPosition: {
      xPercent: 56,
      yPercent: 100,
      scale: 1,
    },
  },
  merchant_western_city: {
    npcInstanceId: "merchant_western_city",
    settlementId: "western_great_city",
    locationId: "western_great_city",
    sceneMode: "merchant",
    backgroundUrl: `${LOCATION_BACKGROUND_PATH}merchant_stall.png`,
  },
  city_merchant_main: {
    npcInstanceId: "city_merchant_main",
    settlementId: "western_great_city",
    locationId: "western_great_city",
    sceneMode: "merchant",
    backgroundUrl: `${LOCATION_BACKGROUND_PATH}merchant_stall.png`,
  },
  merchant_southern_city: {
    npcInstanceId: "merchant_southern_city",
    settlementId: "southern_castle",
    locationId: "southern_castle",
    sceneMode: "merchant",
    backgroundUrl: `${LOCATION_BACKGROUND_PATH}southern_city.png`,
  },
  guard_central_settlement_gate: {
    npcInstanceId: "guard_central_settlement_gate",
    settlementId: "central_settlement",
    locationId: "central_settlement",
    sceneMode: "gate",
    backgroundUrl: `${LOCATION_BACKGROUND_PATH}central_settlement.png`,
  },
};

export function getSceneAssetDefinition(npcInstanceId?: string, locationId?: string, sceneMode?: NpcSceneMode) {
  if (npcInstanceId && sceneAssetDefinitions[npcInstanceId]) {
    return sceneAssetDefinitions[npcInstanceId];
  }

  return Object.values(sceneAssetDefinitions).find((definition) => (
    definition.locationId === locationId && definition.sceneMode === sceneMode
  ));
}
