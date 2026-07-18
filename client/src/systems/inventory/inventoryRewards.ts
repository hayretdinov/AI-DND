import { getItemTemplateById, type ItemId } from "../../data/itemRegistry";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import type { AiGameCommand } from "../ai/aiCommandParser";
import { addPlayerGold, type GameSave } from "../save/saveSystem";
import type { InventoryItem } from "../../types/inventory";
import type { NpcDefinition } from "../../types/npc";

export type ItemRewardSource =
  | "anariel_intro_ai"
  | "anariel_ai"
  | "npc_ai"
  | "gate_ask_food"
  | "scripted_event";

export type ItemTransferReason =
  | "trade"
  | "barter"
  | "quest_reward"
  | "return_item"
  | "scripted_story"
  | "loot"
  | "service_result";

export type PendingAuthorizedTransfer = {
  itemId: string;
  quantity: number;
  sourceNpcId?: string;
  eventId?: string;
  reason: ItemTransferReason;
  authorized: boolean;
};

export type ItemRewardContext = {
  npcRole?: string;
  npcTemplateId?: string;
  npcInstanceId?: string;
  npcStatus?: string;
  eventId?: string;
  enemyDefeated?: boolean;
  playerIntent?: string;
  locationId?: string;
};

export type AppliedItemReward = {
  itemId: ItemId;
  itemNameKey: string;
  quantity: number;
};

export type AppliedRewardResult = {
  save: GameSave;
  itemRewards: AppliedItemReward[];
  goldRewards: number[];
};

const ANARIEL_INTRO_REWARDS: ItemId[] = [];
const GUARD_REWARDS: ItemId[] = [
  "stale_bread",
  "bandage",
  "torch",
  "small_coin_pouch",
  "simple_clothes",
  "sealed_letter",
];
const GUARD_CONTEXT_REWARDS: ItemId[] = ["wooden_club", "cracked_wooden_shield", "rusty_key"];
const BANDIT_REWARDS: ItemId[] = ["stale_bread", "small_coin_pouch", "lockpick", "leather_scrap", "wooden_club", "old_dagger", "rusty_axe", "simple_arrows"];
const BANDIT_DEFEATED_REWARDS: ItemId[] = ["rusty_sword", "iron_sword", "simple_bow", "cracked_wooden_shield"];
const MERCHANT_REWARDS: ItemId[] = [
  "stale_bread",
  "healing_herb",
  "bandage",
  "small_health_potion",
  "small_coin_pouch",
  "lockpick",
  "torch",
  "leather_scrap",
  "simple_clothes",
  "old_cloak",
  "rusty_axe",
  "old_dagger",
  "simple_bow",
  "simple_arrows",
  "armor_piercing_arrows",
  "spear",
  "iron_sword",
  "steel_sword",
  "iron_mace",
  "steel_mace",
  "cracked_wooden_shield",
];
const CIVILIAN_REWARDS: ItemId[] = ["stale_bread", "small_coin_pouch", "simple_clothes", "old_cloak", "torn_note", "sealed_letter", "wooden_club"];
const HEALER_REWARDS: ItemId[] = ["healing_herb", "bandage", "small_health_potion"];
const MAGE_REWARDS: ItemId[] = ["mana_potion_small", "healing_herb", "small_health_potion", "sealed_letter"];
const MAGE_CONTEXT_REWARDS: ItemId[] = ["old_amulet"];

function createRewardItem(templateId: ItemId, quantity: number, transferReason: ItemTransferReason): InventoryItem {
  const template = getItemTemplateById(templateId);

  if (!template) {
    throw new Error(`Unknown item template: ${templateId}`);
  }

  return {
    ...template,
    id: `${templateId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    instanceId: `${templateId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    itemId: templateId,
    quantity,
    condition: "intact",
    quality: template.defaultQuality ?? "common",
    origin: transferReason,
    owner: "player",
    createdAt: new Date().toISOString(),
  };
}

function clampQuantity(value: number) {
  return Math.min(5, Math.max(1, Math.floor(value)));
}

function warnUnauthorizedTransfer(
  itemId: string,
  quantity: number,
  source: ItemRewardSource,
  transfer?: PendingAuthorizedTransfer,
) {
  const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;

  if (isDev) {
    console.warn("[InventoryReward] Unauthorized item transfer blocked", {
      itemId,
      quantity,
      source,
      transfer,
    });
  }
}

function isAuthorizedTransfer(itemId: string, quantity: number, transfer?: PendingAuthorizedTransfer) {
  return Boolean(
    transfer?.authorized &&
      transfer.reason &&
      transfer.itemId === itemId &&
      Number.isFinite(transfer.quantity) &&
      transfer.quantity >= quantity,
  );
}

export function getAllowedAnarielRewardIds(isIntro: boolean): ItemId[] {
  return isIntro ? ANARIEL_INTRO_REWARDS : [];
}

export function getAllowedNpcRewardIds(npc: Pick<NpcDefinition, "role">): ItemId[] {
  return getAllowedItemRewardsForContext({ npcRole: npc.role });
}

export function getAllowedItemRewardsForContext(context: ItemRewardContext): ItemId[] {
  if (context.eventId === "anariel_intro") {
    return [];
  }

  if (context.npcStatus === "dead" || context.npcStatus === "gone" || context.npcStatus === "escaped") {
    return [];
  }

  const role = context.npcRole;

  if (role === "monster") {
    return [];
  }

  const hasQuestContext = Boolean(context.eventId?.includes("quest") || context.playerIntent?.includes("quest"));
  const storyAppropriate = Boolean(hasQuestContext || context.playerIntent === "ask_for_item");
  const defeatedOrForced = Boolean(
    context.enemyDefeated ||
    context.playerIntent === "intimidate" ||
    context.playerIntent === "threaten" ||
    context.playerIntent === "disarm",
  );

  if (role === "guard") {
    return storyAppropriate ? [...GUARD_REWARDS, ...GUARD_CONTEXT_REWARDS] : GUARD_REWARDS;
  }

  if (role === "bandit") {
    return defeatedOrForced ? [...BANDIT_REWARDS, ...BANDIT_DEFEATED_REWARDS] : BANDIT_REWARDS;
  }

  if (role === "merchant") {
    return context.npcTemplateId?.includes("mage") || context.npcTemplateId?.includes("alchemist")
      ? [...MERCHANT_REWARDS, "mana_potion_small"]
      : MERCHANT_REWARDS;
  }

  if (role === "civilian") {
    return CIVILIAN_REWARDS;
  }

  if (role === "healer" || role === "herbalist") {
    return HEALER_REWARDS;
  }

  if (role === "mage" || role === "alchemist") {
    return hasQuestContext ? [...MAGE_REWARDS, ...MAGE_CONTEXT_REWARDS] : MAGE_REWARDS;
  }

  return [];
}

export function canNpcRewardGold(npc: Pick<NpcDefinition, "role">) {
  return npc.role === "guard" || npc.role === "merchant" || npc.role === "civilian";
}

export function addItemToInventory(
  save: GameSave,
  itemId: string,
  quantity: number,
  source: ItemRewardSource,
  transfer?: PendingAuthorizedTransfer,
): { save: GameSave; reward?: AppliedItemReward } {
  if (!isAuthorizedTransfer(itemId, quantity, transfer)) {
    warnUnauthorizedTransfer(itemId, quantity, source, transfer);
    return { save };
  }
  const authorizedTransfer = transfer as PendingAuthorizedTransfer;

  const template = getItemTemplateById(itemId);

  if (!template) {
    console.warn("[InventoryReward] Unknown item reward ignored", { itemId, quantity, source });
    return { save };
  }

  const rewardItemId = itemId as ItemId;
  const safeQuantity = clampQuantity(quantity);
  const inventory = save.inventory ?? createDefaultInventoryState();

  if (template.stackable) {
    const maxStack = template.maxStack ?? 99;
    let remainingQuantity = safeQuantity;
    const updatedItems = inventory.items.map((item) => {
      if (item.templateId !== itemId || remainingQuantity <= 0 || item.quantity >= maxStack) {
        return item;
      }

      const available = maxStack - item.quantity;
      const added = Math.min(available, remainingQuantity);
      remainingQuantity -= added;
      return { ...item, quantity: item.quantity + added };
    });

    if (remainingQuantity < safeQuantity) {
      const extraStacks: InventoryItem[] = [];

      while (remainingQuantity > 0) {
        const stackQuantity = Math.min(maxStack, remainingQuantity);
        extraStacks.push(createRewardItem(rewardItemId, stackQuantity, authorizedTransfer.reason));
        remainingQuantity -= stackQuantity;
      }

      const nextSave = {
        ...save,
        inventory: {
          ...inventory,
          items: [...updatedItems, ...extraStacks],
        },
      };

      console.info("[InventoryReward] stacked item", { itemId, quantity: safeQuantity, source });
      return {
        save: nextSave,
        reward: { itemId: rewardItemId, itemNameKey: template.nameKey, quantity: safeQuantity },
      };
    }
  }

  const createdItems = Array.from({ length: template.stackable ? 1 : safeQuantity }, () =>
    createRewardItem(rewardItemId, template.stackable ? safeQuantity : 1, authorizedTransfer.reason),
  );
  const nextSave = {
    ...save,
    inventory: {
      ...inventory,
      items: [...inventory.items, ...createdItems],
    },
  };

  console.info("[InventoryReward] added item", { itemId, quantity: safeQuantity, source });
  return {
    save: nextSave,
    reward: { itemId: rewardItemId, itemNameKey: template.nameKey, quantity: safeQuantity },
  };
}

export function applyAiRewardCommands(
  save: GameSave,
  commands: AiGameCommand[],
  options: {
    allowedItemIds: readonly ItemId[];
    canRewardGold: boolean;
    source: ItemRewardSource;
    authorizedTransfers?: readonly PendingAuthorizedTransfer[];
  },
): AppliedRewardResult {
  const allowedItemIds = new Set<string>(options.allowedItemIds);
  const result: AppliedRewardResult = {
    save,
    itemRewards: [],
    goldRewards: [],
  };

  for (const command of commands) {
    if (command.type === "giveItem") {
      if (!allowedItemIds.has(command.itemId)) {
        console.warn("[InventoryReward] Disallowed item reward ignored", {
          itemId: command.itemId,
          source: options.source,
        });
        continue;
      }

      const authorizedTransfer = options.authorizedTransfers?.find((transfer) =>
        isAuthorizedTransfer(command.itemId, command.quantity, transfer),
      );

      if (!authorizedTransfer) {
        warnUnauthorizedTransfer(command.itemId, command.quantity, options.source);
        continue;
      }

      const addResult = addItemToInventory(
        result.save,
        command.itemId,
        command.quantity,
        options.source,
        authorizedTransfer,
      );
      result.save = addResult.save;

      if (addResult.reward) {
        result.itemRewards.push(addResult.reward);
      }
      continue;
    }

    if (!options.canRewardGold) {
      console.warn("[InventoryReward] Disallowed gold reward ignored", {
        amount: command.amount,
        source: options.source,
      });
      continue;
    }

    result.save = addPlayerGold(result.save, command.amount, options.source);
    result.goldRewards.push(command.amount);
  }

  return result;
}

export function applyAiGameCommandsToInventory(
  save: GameSave,
  commands: AiGameCommand[],
  context: ItemRewardContext & { source?: ItemRewardSource; canRewardGold?: boolean },
): AppliedRewardResult & { notifications: string[] } {
  const allowedItemIds = getAllowedItemRewardsForContext(context);
  const result = applyAiRewardCommands(save, commands, {
    allowedItemIds,
    canRewardGold: Boolean(context.canRewardGold && context.npcStatus !== "dead" && context.npcRole !== "monster"),
    source: context.source ?? "npc_ai",
    authorizedTransfers: [],
  });

  return {
    ...result,
    notifications: [
      ...result.itemRewards.map((reward) => `inventory.receivedItem:${reward.itemNameKey}:${reward.quantity}`),
      ...result.goldRewards.map((amount) => `inventory.receivedGold:${amount}`),
    ],
  };
}
