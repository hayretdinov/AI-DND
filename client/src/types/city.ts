import type { TranslationKey } from "../i18n/i18n";

export type CityId = "western_great_city" | "central_settlement";

export type CityAccessStatus = "unknown" | "allowed" | "denied" | "conditional";

export type CityAccessRecord = {
  status: CityAccessStatus;
  grantedByNpcId?: string;
  grantedAtGameTime?: string;
  revokedReason?: string;
};

export type CityAccessState = Partial<Record<CityId, CityAccessRecord>>;

export type CityState = {
  currentCityId?: CityId;
  currentCityLocationId?: string;
  lastVisitedNpcId?: string;
  discoveredLocationIds: string[];
};

export type NavigationReturnContext = {
  screen: "eventScene" | "merchantScene" | "cityMap";
  cityId?: CityId;
  locationId?: string;
  npcInstanceId?: string;
  eventId?: string;
  sceneMode?: string;
};

export type CityMapLocation = {
  id: string;
  cityId: CityId;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  xPercent: number;
  yPercent: number;
  markerType: "palace" | "temple" | "archive" | "military" | "market" | "guild" | "gate" | "district";
  initiallyDiscovered: boolean;
  locked?: boolean;
  unavailableReasonKey?: TranslationKey;
};

export type CityMapNpcPlacement = {
  cityId: CityId;
  npcInstanceId: string;
  locationId: string;
  xPercent: number;
  yPercent: number;
  visible: boolean;
  available: boolean;
  imageUrl?: string;
  portraitUrl?: string;
  unavailableReasonKey?: TranslationKey;
};
