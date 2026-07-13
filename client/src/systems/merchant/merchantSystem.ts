import { itemRegistry, type ItemId } from "../../data/itemRegistry";
import type { WorldMapNodeId } from "../../data/worldMap";
import type { InventoryItem, InventoryState } from "../../types/inventory";
import type { MerchantDeal, MerchantState, MerchantTradeMemory } from "../../types/merchant";
import type { PlayerCharacter } from "../../types/player";
import type { GameSave } from "../save/saveSystem";

type MerchantStockEntry = {
  itemId: ItemId;
  quantity: number;
};

const MERCHANT_STOCK: Record<string, { gold: number; items: MerchantStockEntry[] }> = {
  merchant_central_settlement: {
    gold: 85,
    items: [
      { itemId: "stale_bread", quantity: 6 },
      { itemId: "torch", quantity: 3 },
      { itemId: "healing_herb", quantity: 3 },
      { itemId: "bandage", quantity: 4 },
      { itemId: "simple_clothes", quantity: 1 },
      { itemId: "old_cloak", quantity: 1 },
    ],
  },
  merchant_southern_city: {
    gold: 160,
    items: [
      { itemId: "stale_bread", quantity: 5 },
      { itemId: "bandage", quantity: 6 },
      { itemId: "small_health_potion", quantity: 2 },
      { itemId: "rusty_sword", quantity: 1 },
      { itemId: "wooden_club", quantity: 2 },
      { itemId: "cracked_wooden_shield", quantity: 1 },
    ],
  },
  merchant_western_city: {
    gold: 120,
    items: [
      { itemId: "stale_bread", quantity: 4 },
      { itemId: "lockpick", quantity: 3 },
      { itemId: "old_dagger", quantity: 1 },
      { itemId: "rusty_axe", quantity: 1 },
      { itemId: "leather_scrap", quantity: 8 },
      { itemId: "sealed_letter", quantity: 1 },
    ],
  },
  city_merchant_main: {
    gold: 120,
    items: [
      { itemId: "stale_bread", quantity: 4 },
      { itemId: "lockpick", quantity: 3 },
      { itemId: "old_dagger", quantity: 1 },
      { itemId: "rusty_axe", quantity: 1 },
      { itemId: "leather_scrap", quantity: 8 },
      { itemId: "sealed_letter", quantity: 1 },
    ],
  },
};

function createInstanceId(owner: string, itemId: string) {
  return `${owner}_${itemId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function createMerchantItem(itemId: ItemId, quantity: number, merchantId: string): InventoryItem {
  const template = itemRegistry[itemId];
  const instanceId = createInstanceId(merchantId, itemId);

  return {
    ...template,
    id: instanceId,
    instanceId,
    itemId,
    quantity,
    condition: template.defaultQuality === "poor" ? "worn" : "intact",
    quality: template.defaultQuality ?? "common",
    origin: merchantId,
    owner: merchantId,
    createdAt: new Date().toISOString(),
  };
}

export function createInitialMerchantState(merchantId: string): MerchantState {
  const stock = MERCHANT_STOCK[merchantId] ?? MERCHANT_STOCK.merchant_central_settlement;

  return {
    merchantId,
    gold: stock.gold,
    items: stock.items.map((item) => createMerchantItem(item.itemId, item.quantity, merchantId)),
    relationship: 0,
    trust: 0,
    haggleCount: 0,
    tradeHistory: [],
    activeQuests: [],
    completedQuests: [],
  };
}

export function getMerchantState(save: GameSave | null, merchantId: string) {
  return save?.merchants?.instances?.[merchantId] ?? createInitialMerchantState(merchantId);
}

function getRarityMultiplier(rarity: InventoryItem["rarity"]) {
  const multipliers: Record<InventoryItem["rarity"], number> = {
    common: 1,
    uncommon: 1.35,
    rare: 1.8,
    unique: 2.4,
    epic: 3,
    legendary: 4,
  };

  return multipliers[rarity] ?? 1;
}

function getConditionMultiplier(item: InventoryItem) {
  if (item.condition === "broken") {
    return 0.2;
  }

  if (item.condition === "damaged") {
    return 0.45;
  }

  if (item.condition === "worn") {
    return 0.75;
  }

  return 1;
}

function getCharismaModifier(player: PlayerCharacter) {
  return Math.floor(((player.attributes?.charisma ?? 10) - 10) / 2);
}

export function calculateMerchantOffer(
  merchant: MerchantState,
  player: PlayerCharacter,
  item: InventoryItem,
  side: MerchantDeal["side"],
) {
  const base = Math.max(1, item.value * item.quantity);
  const rarity = getRarityMultiplier(item.rarity);
  const condition = getConditionMultiplier(item);
  const charisma = getCharismaModifier(player);
  const relationship = merchant.relationship / 100;
  const deterministicNoise = ((item.id.length + merchant.merchantId.length) % 5) - 2;
  const marketValue = Math.max(1, Math.round(base * rarity * condition));
  const buyFactor = 0.55 + relationship * 0.1 + charisma * 0.02;
  const sellFactor = 1.18 - relationship * 0.08 - charisma * 0.015;
  const offer = side === "player_sells"
    ? Math.min(merchant.gold, Math.max(1, Math.round(marketValue * buyFactor + deterministicNoise)))
    : Math.max(1, Math.round(marketValue * sellFactor + deterministicNoise));

  return { basePrice: marketValue, merchantOffer: offer };
}

export function createMerchantDeal(
  merchant: MerchantState,
  player: PlayerCharacter,
  item: InventoryItem,
  side: MerchantDeal["side"],
): MerchantState {
  const price = calculateMerchantOffer(merchant, player, item, side);

  return {
    ...merchant,
    activeDeal: {
      id: `deal_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      side,
      itemInstanceId: item.id,
      itemId: item.templateId,
      quantity: item.quantity,
      basePrice: price.basePrice,
      merchantOffer: price.merchantOffer,
      dealState: "offered",
      createdAt: new Date().toISOString(),
    },
  };
}

export function parseTradeReply(text: string) {
  const lowered = text.toLowerCase();
  const numberMatch = lowered.match(/\d+/);
  const accepts = /хорошо|соглас|договор|беру|ладно|yes|agree|deal|ok/.test(lowered);
  const refuses = /нет|отказ|не хочу|no|refuse|cancel/.test(lowered);
  const haggles = /мало|дорого|добав|скинь|дешев|more|less|too much|too low|counter/.test(lowered);

  return {
    accepts,
    refuses,
    haggles,
    counterOffer: numberMatch ? Number(numberMatch[0]) : undefined,
  };
}

export function respondToTradeText(merchant: MerchantState, player: PlayerCharacter, text: string): { merchant: MerchantState; text: string } {
  if (!merchant.activeDeal) {
    return { merchant, text: "" };
  }

  const parsed = parseTradeReply(text);
  const deal = merchant.activeDeal;
  const charisma = getCharismaModifier(player);
  const maxConcession = Math.max(1, Math.round(deal.basePrice * (0.12 + Math.max(0, charisma) * 0.02)));
  const desired = parsed.counterOffer;

  if (parsed.refuses) {
    return {
      merchant: rememberTrade({ ...merchant, activeDeal: undefined }, {
        type: "refuse",
        itemId: deal.itemId,
        quantity: deal.quantity,
        price: deal.merchantOffer,
        note: "Player refused merchant deal.",
      }),
      text: "merchant.trade.refused",
    };
  }

  if (parsed.accepts && !desired) {
    return {
      merchant: { ...merchant, activeDeal: { ...deal, dealState: "accepted" } },
      text: "merchant.trade.accepted",
    };
  }

  if (parsed.haggles || desired) {
    const target = desired ?? (deal.side === "player_sells" ? deal.merchantOffer + maxConcession : deal.merchantOffer - maxConcession);
    const acceptable = deal.side === "player_sells"
      ? target <= deal.merchantOffer + maxConcession
      : target >= deal.merchantOffer - maxConcession;
    const nextOffer = acceptable
      ? target
      : deal.side === "player_sells"
        ? deal.merchantOffer + Math.ceil(maxConcession / 2)
        : Math.max(1, deal.merchantOffer - Math.ceil(maxConcession / 2));

    return {
      merchant: {
        ...merchant,
        haggleCount: merchant.haggleCount + 1,
        activeDeal: {
          ...deal,
          playerCounterOffer: desired,
          merchantOffer: nextOffer,
          dealState: acceptable ? "accepted" : "countered",
        },
      },
      text: acceptable ? "merchant.trade.acceptedCounter" : "merchant.trade.countered",
    };
  }

  return {
    merchant,
    text: "merchant.trade.awaiting",
  };
}

function removeItem(items: InventoryItem[], itemInstanceId: string) {
  return items.filter((item) => item.id !== itemInstanceId);
}

function addItem(items: InventoryItem[], item: InventoryItem, owner: string) {
  const instanceId = createInstanceId(owner, item.templateId);

  return [
    ...items,
    {
      ...item,
      id: instanceId,
      instanceId,
      owner,
      origin: item.origin ?? "trade",
      createdAt: new Date().toISOString(),
    },
  ];
}

function rememberTrade(merchant: MerchantState, memory: Omit<MerchantTradeMemory, "id" | "createdAt">): MerchantState {
  return {
    ...merchant,
    tradeHistory: [
      ...merchant.tradeHistory,
      {
        ...memory,
        id: `trade_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      },
    ].slice(-30),
  };
}

export function confirmMerchantDeal(save: GameSave, merchant: MerchantState): { save: GameSave; merchant: MerchantState; ok: boolean; reason?: string } {
  const deal = merchant.activeDeal;

  if (!deal || deal.dealState !== "accepted") {
    return { save, merchant, ok: false, reason: "notAccepted" };
  }

  const inventory = save.inventory;

  if (!inventory) {
    return { save, merchant, ok: false, reason: "noInventory" };
  }

  if (deal.side === "player_sells") {
    const playerItem = inventory.items.find((item) => item.id === deal.itemInstanceId);

    if (!playerItem || merchant.gold < deal.merchantOffer) {
      return { save, merchant, ok: false, reason: "cannotPay" };
    }

    const nextInventory: InventoryState = {
      ...inventory,
      gold: inventory.gold + deal.merchantOffer,
      items: removeItem(inventory.items, playerItem.id),
      equipment: Object.fromEntries(Object.entries(inventory.equipment).filter(([, itemId]) => itemId !== playerItem.id)),
    };
    const nextMerchant = rememberTrade({
      ...merchant,
      gold: merchant.gold - deal.merchantOffer,
      items: addItem(merchant.items, playerItem, merchant.merchantId),
      activeDeal: undefined,
      relationship: Math.min(100, merchant.relationship + 1),
    }, {
      type: "sell",
      itemId: playerItem.templateId,
      quantity: playerItem.quantity,
      price: deal.merchantOffer,
      note: "Player sold item to merchant.",
    });

    return {
      save: { ...save, inventory: nextInventory },
      merchant: nextMerchant,
      ok: true,
    };
  }

  const merchantItem = merchant.items.find((item) => item.id === deal.itemInstanceId);

  if (!merchantItem || inventory.gold < deal.merchantOffer) {
    return { save, merchant, ok: false, reason: "cannotBuy" };
  }

  const nextInventory: InventoryState = {
    ...inventory,
    gold: inventory.gold - deal.merchantOffer,
    items: addItem(inventory.items, merchantItem, "player"),
  };
  const nextMerchant = rememberTrade({
    ...merchant,
    gold: merchant.gold + deal.merchantOffer,
    items: removeItem(merchant.items, merchantItem.id),
    activeDeal: undefined,
    relationship: Math.min(100, merchant.relationship + 1),
  }, {
    type: "buy",
    itemId: merchantItem.templateId,
    quantity: merchantItem.quantity,
    price: deal.merchantOffer,
    note: "Player bought item from merchant.",
  });

  return {
    save: { ...save, inventory: nextInventory },
    merchant: nextMerchant,
    ok: true,
  };
}

export function upsertMerchant(save: GameSave, merchant: MerchantState): GameSave {
  return {
    ...save,
    merchants: {
      ...(save.merchants ?? { instances: {} }),
      instances: {
        ...(save.merchants?.instances ?? {}),
        [merchant.merchantId]: merchant,
      },
    },
  };
}

export function getMerchantQuestHint(merchantId: string, locationId?: WorldMapNodeId) {
  if (merchantId === "merchant_central_settlement") {
    return "merchant.quest.central";
  }

  if (locationId === "southern_castle") {
    return "merchant.quest.southern";
  }

  return "merchant.quest.western";
}
