import type { InventoryItem } from "./inventory";

export type MerchantDealSide = "player_sells" | "player_buys";
export type MerchantDealState = "none" | "offered" | "countered" | "accepted" | "negotiation_closed";

export type MerchantTradeMemory = {
  id: string;
  type: "buy" | "sell" | "haggle" | "refuse" | "quest";
  itemId?: string;
  quantity?: number;
  price?: number;
  note: string;
  createdAt: string;
};

export type MerchantDeal = {
  id: string;
  side: MerchantDealSide;
  itemInstanceId: string;
  itemId: string;
  quantity: number;
  basePrice: number;
  merchantOffer: number;
  playerCounterOffer?: number;
  dealState: MerchantDealState;
  createdAt: string;
};

export type MerchantState = {
  merchantId: string;
  gold: number;
  items: InventoryItem[];
  relationship: number;
  trust: number;
  haggleCount: number;
  tradeHistory: MerchantTradeMemory[];
  activeQuests: string[];
  completedQuests: string[];
  activeDeal?: MerchantDeal;
};

export type MerchantsState = {
  instances: Record<string, MerchantState>;
};
