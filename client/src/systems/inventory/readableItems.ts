import { getItemTemplateById, type ItemId } from "../../data/itemRegistry";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import type { GameSave } from "../save/saveSystem";
import type { InventoryItem } from "../../types/inventory";

export const MAGIC_APPRENTICE_GUIDE_ITEM_ID = "magic_apprentice_guide";
export const MAGIC_APPRENTICE_GUIDE_ASSET_ID = "magic_apprentice_guide";
export const MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID = "melee_combat_beginner_guide";
export const MELEE_COMBAT_BEGINNER_GUIDE_ASSET_ID = "melee-combat-beginner-guide";
export const CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID = "crossbow_and_bolts_guide";
export const CROSSBOW_AND_BOLTS_GUIDE_ASSET_ID = "crossbow-and-bolts-guide";
export const ARCHERY_BASICS_GUIDE_ITEM_ID = "archery_basics_guide";
export const ARCHERY_BASICS_GUIDE_ASSET_ID = "crossbow-and-bolts-guide";

export type ContextGuideId =
  | typeof MAGIC_APPRENTICE_GUIDE_ITEM_ID
  | typeof MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID
  | typeof CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID
  | typeof ARCHERY_BASICS_GUIDE_ITEM_ID;

export type ContextGuideDefinition = {
  id: ContextGuideId;
  itemId: ContextGuideId;
  titleKey: string;
  descriptionKey: string;
  openKey: string;
  closeKey: string;
  requiredKey: string;
  altKey: string;
};

export type ReadableImageAsset = {
  src: string;
  altKey: string;
};

const readableImageAssets: Record<string, ReadableImageAsset> = {
  [MAGIC_APPRENTICE_GUIDE_ASSET_ID]: {
    src: "/assets/items/documents/magic_apprentice_guide.png",
    altKey: "magicGuide.imageAlt",
  },
  [MELEE_COMBAT_BEGINNER_GUIDE_ASSET_ID]: {
    src: "/assets/items/guides/melee-combat-beginner-guide.png",
    altKey: "guide.meleeCombat.imageAlt",
  },
  [CROSSBOW_AND_BOLTS_GUIDE_ASSET_ID]: {
    src: "/assets/items/guides/crossbow-and-bolts-guide.png",
    altKey: "guide.crossbow.imageAlt",
  },
};

export const contextGuideDefinitions: Record<ContextGuideId, ContextGuideDefinition> = {
  [MAGIC_APPRENTICE_GUIDE_ITEM_ID]: {
    id: MAGIC_APPRENTICE_GUIDE_ITEM_ID,
    itemId: MAGIC_APPRENTICE_GUIDE_ITEM_ID,
    titleKey: "magicGuide.viewerTitle",
    descriptionKey: "items.magicApprenticeGuide.description",
    openKey: "magicGuide.quickButtonTooltip",
    closeKey: "magicGuide.closeTooltip",
    requiredKey: "magicGuide.notInInventory",
    altKey: "magicGuide.imageAlt",
  },
  [MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID]: {
    id: MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
    itemId: MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
    titleKey: "guide.meleeCombat.viewerTitle",
    descriptionKey: "items.meleeCombatBeginnerGuide.description",
    openKey: "guide.meleeCombat.open",
    closeKey: "guide.meleeCombat.close",
    requiredKey: "guide.meleeCombat.itemRequired",
    altKey: "guide.meleeCombat.imageAlt",
  },
  [CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID]: {
    id: CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
    itemId: CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
    titleKey: "guide.crossbow.viewerTitle",
    descriptionKey: "items.crossbowAndBoltsGuide.description",
    openKey: "guide.crossbow.open",
    closeKey: "guide.crossbow.close",
    requiredKey: "guide.crossbow.itemRequired",
    altKey: "guide.crossbow.imageAlt",
  },
  [ARCHERY_BASICS_GUIDE_ITEM_ID]: {
    id: ARCHERY_BASICS_GUIDE_ITEM_ID,
    itemId: ARCHERY_BASICS_GUIDE_ITEM_ID,
    titleKey: "guide.archery.viewerTitle",
    descriptionKey: "items.archeryBasicsGuide.description",
    openKey: "guide.archery.open",
    closeKey: "guide.archery.close",
    requiredKey: "guide.archery.itemRequired",
    altKey: "guide.crossbow.imageAlt",
  },
};

export function getReadableImageAsset(item: InventoryItem | null): ReadableImageAsset | null {
  if (!item?.readable || item.readContentType !== "image" || !item.readAssetId) {
    return null;
  }

  return readableImageAssets[item.readAssetId] ?? null;
}

export function inventoryContainsItem(save: GameSave | null | undefined, itemId: string) {
  return Boolean(
    save?.inventory?.items.some(
      (item) =>
        item.quantity > 0 &&
        (item.itemId === itemId || item.templateId === itemId),
    ),
  );
}

export function getMagicApprenticeGuideItem(save: GameSave | null | undefined) {
  return getContextGuideItem(save, MAGIC_APPRENTICE_GUIDE_ITEM_ID);
}

export function getContextGuideItem(save: GameSave | null | undefined, guideId: ContextGuideId) {
  return (
    save?.inventory?.items.find(
      (item) =>
        item.quantity > 0 &&
        (item.itemId === guideId || item.templateId === guideId),
    ) ?? null
  );
}

export function isGuideRead(save: GameSave | null | undefined, guideId: ContextGuideId) {
  return Boolean(save?.contextGuides?.readGuideIds.includes(guideId));
}

export function markGuideRead(save: GameSave, guideId: ContextGuideId): GameSave {
  const readGuideIds = save.contextGuides?.readGuideIds ?? [];

  if (readGuideIds.includes(guideId)) {
    return save;
  }

  return {
    ...save,
    contextGuides: {
      readGuideIds: [...readGuideIds, guideId],
    },
  };
}

export function createInventoryItemFromTemplate(
  itemId: ItemId,
  quantity = 1,
  origin = "scripted_story",
): InventoryItem | null {
  const template = getItemTemplateById(itemId);

  if (!template) {
    return null;
  }

  const instanceId = `${itemId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

  return {
    ...template,
    id: instanceId,
    instanceId,
    itemId,
    quantity,
    condition: "intact",
    quality: template.defaultQuality ?? "common",
    origin,
    owner: "player",
    createdAt: new Date().toISOString(),
  };
}

export function addUniqueInventoryItem(save: GameSave, itemId: ItemId, origin = "scripted_story"): GameSave {
  if (inventoryContainsItem(save, itemId)) {
    return save;
  }

  const createdItem = createInventoryItemFromTemplate(itemId, 1, origin);

  if (!createdItem) {
    return save;
  }

  const inventory = save.inventory ?? createDefaultInventoryState();

  return {
    ...save,
    inventory: {
      ...inventory,
      items: [...inventory.items, createdItem],
    },
  };
}

export function removeInventoryItemByTemplateId(save: GameSave, itemId: string): GameSave {
  const inventory = save.inventory ?? createDefaultInventoryState();

  return {
    ...save,
    inventory: {
      ...inventory,
      items: inventory.items.filter((item) => item.itemId !== itemId && item.templateId !== itemId),
      equipment: Object.fromEntries(
        Object.entries(inventory.equipment).filter(([, equippedItemId]) =>
          inventory.items.some(
            (item) =>
              item.id === equippedItemId &&
              item.itemId !== itemId &&
              item.templateId !== itemId,
          ),
        ),
      ),
    },
  };
}
