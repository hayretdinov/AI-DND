import { createDefaultInventoryState } from "../../data/inventoryMockData";
import {
  addUniqueInventoryItem,
  ARCHERY_BASICS_GUIDE_ITEM_ID,
  CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
  getMagicApprenticeGuideItem,
  getReadableImageAsset,
  inventoryContainsItem,
  isGuideRead,
  MAGIC_APPRENTICE_GUIDE_ITEM_ID,
  markGuideRead,
  MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
} from "./readableItems";
import type { GameSave } from "../save/saveSystem";

const mockSave = {
  player: {
    id: "test-player",
    name: "Test Mage",
    origin: "scholar",
    race: "human",
    gender: "male",
    characterClass: "mage",
    appearance: "wanderer",
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 12,
      wisdom: 10,
      charisma: 10,
    },
    derivedStats: {
      health: 10,
      stamina: 10,
      armorClass: 10,
    },
    createdAt: "2026-07-15T00:00:00.000Z",
  },
  inventory: createDefaultInventoryState(),
} as unknown as GameSave;

const saveWithGuide = addUniqueInventoryItem(mockSave, MAGIC_APPRENTICE_GUIDE_ITEM_ID, "test");
const saveWithDuplicateAttempt = addUniqueInventoryItem(saveWithGuide, MAGIC_APPRENTICE_GUIDE_ITEM_ID, "test");
const guideItem = getMagicApprenticeGuideItem(saveWithGuide);
const guideAsset = getReadableImageAsset(guideItem);
const saveWithMeleeGuide = addUniqueInventoryItem(mockSave, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID, "test");
const meleeGuideItem = saveWithMeleeGuide.inventory?.items.find((item) => item.itemId === MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID) ?? null;
const meleeGuideAsset = getReadableImageAsset(meleeGuideItem);
const saveWithReadMeleeGuide = markGuideRead(saveWithMeleeGuide, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID);
const saveWithCrossbowGuide = addUniqueInventoryItem(mockSave, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID, "test");
const crossbowGuideItem = saveWithCrossbowGuide.inventory?.items.find((item) => item.itemId === CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID) ?? null;
const crossbowGuideAsset = getReadableImageAsset(crossbowGuideItem);
const saveWithReadCrossbowGuide = markGuideRead(saveWithCrossbowGuide, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID);
const saveWithArcheryGuide = addUniqueInventoryItem(mockSave, ARCHERY_BASICS_GUIDE_ITEM_ID, "test");
const archeryGuideItem = saveWithArcheryGuide.inventory?.items.find((item) => item.itemId === ARCHERY_BASICS_GUIDE_ITEM_ID) ?? null;
const archeryGuideAsset = getReadableImageAsset(archeryGuideItem);
const saveWithReadArcheryGuide = markGuideRead(saveWithArcheryGuide, ARCHERY_BASICS_GUIDE_ITEM_ID);

if (!inventoryContainsItem(saveWithGuide, MAGIC_APPRENTICE_GUIDE_ITEM_ID)) {
  throw new Error("Mage Apprentice Guide should be present after granting it.");
}

if (saveWithDuplicateAttempt.inventory?.items.length !== saveWithGuide.inventory?.items.length) {
  throw new Error("Mage Apprentice Guide should not duplicate when granted twice.");
}

if (!guideItem?.readable || guideItem.readContentType !== "image") {
  throw new Error("Mage Apprentice Guide should be registered as a readable image item.");
}

if (guideAsset?.src !== "/assets/items/documents/magic_apprentice_guide.png") {
  throw new Error("Mage Apprentice Guide should resolve to the project asset path.");
}

if (!inventoryContainsItem(saveWithMeleeGuide, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID)) {
  throw new Error("Melee Combat Beginner Guide should be present after granting it.");
}

if (meleeGuideAsset?.src !== "/assets/items/guides/melee-combat-beginner-guide.png") {
  throw new Error("Melee Combat Beginner Guide should resolve to the project asset path.");
}

if (!isGuideRead(saveWithReadMeleeGuide, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID)) {
  throw new Error("Melee Combat Beginner Guide read state should be persisted in contextGuides.");
}

if (!inventoryContainsItem(saveWithCrossbowGuide, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID)) {
  throw new Error("Crossbow and Bolts Guide should be present after granting it.");
}

if (crossbowGuideAsset?.src !== "/assets/items/guides/crossbow-and-bolts-guide.png") {
  throw new Error("Crossbow and Bolts Guide should resolve to the project asset path.");
}

if (!isGuideRead(saveWithReadCrossbowGuide, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID)) {
  throw new Error("Crossbow and Bolts Guide read state should be persisted in contextGuides.");
}

if (!inventoryContainsItem(saveWithArcheryGuide, ARCHERY_BASICS_GUIDE_ITEM_ID)) {
  throw new Error("Archery Basics Guide should be present after granting it.");
}

if (archeryGuideAsset?.src !== "/assets/items/guides/crossbow-and-bolts-guide.png") {
  throw new Error("Archery Basics Guide should reuse the ranged guide asset path.");
}

if (!isGuideRead(saveWithReadArcheryGuide, ARCHERY_BASICS_GUIDE_ITEM_ID)) {
  throw new Error("Archery Basics Guide read state should be persisted in contextGuides.");
}
