import { useMemo, useState } from "react";
import { createDefaultInventoryState } from "../data/inventoryMockData";
import { WEAPON_TRAINING_ORDER } from "../data/trainingData";
import { t, type TranslationKey } from "../i18n/i18n";
import { loadGame, saveGame, type GameSave } from "../systems/save/saveSystem";
import type { WeaponType } from "../types/combat";
import type { EquipmentSlot, InventoryCategory, InventoryItem, InventoryState } from "../types/inventory";
import type { PlayerCharacter } from "../types/player";

type InventoryProps = {
  onBackToMenu: () => void;
  onOpenMap: () => void;
};

type InventorySort = "recent" | "name" | "weight" | "value" | "quantity" | "rarity";
type InventoryBonusKey = "attack" | "defense" | "evasion" | "blockChance";
type TooltipPosition = {
  x: number;
  y: number;
};

const categoryTabs: Array<{ id: InventoryCategory; labelKey: TranslationKey; icon: string }> = [
  { id: "all", labelKey: "inventoryCategoryAll", icon: "✦" },
  { id: "equipped", labelKey: "inventoryCategoryEquipped", icon: "◆" },
  { id: "backpack", labelKey: "inventoryCategoryBackpack", icon: "◇" },
  { id: "weapon", labelKey: "inventoryCategoryWeapons", icon: "†" },
  { id: "shield", labelKey: "inventoryCategoryShield", icon: "▣" },
  { id: "clothing", labelKey: "inventoryCategoryClothing", icon: "⌁" },
  { id: "medicine", labelKey: "inventoryCategoryMedicine", icon: "+" },
  { id: "document", labelKey: "inventoryCategoryDocuments", icon: "?" },
  { id: "tool", labelKey: "inventoryCategoryTools", icon: "!" },
  { id: "accessory", labelKey: "inventoryCategoryAccessories", icon: "○" },
  { id: "armor", labelKey: "inventoryCategoryArmor", icon: "▣" },
  { id: "consumable", labelKey: "inventoryCategoryConsumables", icon: "◈" },
  { id: "material", labelKey: "inventoryCategoryMaterials", icon: "☘" },
  { id: "quest", labelKey: "inventoryCategoryQuest", icon: "⚿" },
  { id: "misc", labelKey: "inventoryCategoryMisc", icon: "◇" },
];

const equipmentSlots: Array<{ id: EquipmentSlot; labelKey: TranslationKey; className: string }> = [
  { id: "head", labelKey: "inventorySlotHead", className: "inventory-equipment-slot--head" },
  { id: "chest", labelKey: "inventorySlotChest", className: "inventory-equipment-slot--chest" },
  { id: "cloak", labelKey: "inventorySlotCloak", className: "inventory-equipment-slot--back" },
  { id: "mainHand", labelKey: "inventorySlotMainHand", className: "inventory-equipment-slot--right-hand" },
  { id: "offHand", labelKey: "inventorySlotOffHand", className: "inventory-equipment-slot--left-hand" },
  { id: "back", labelKey: "inventorySlotBack", className: "inventory-equipment-slot--back" },
  { id: "ring1", labelKey: "inventorySlotRing1", className: "inventory-equipment-slot--accessory-1" },
  { id: "amulet", labelKey: "inventorySlotAmulet", className: "inventory-equipment-slot--accessory-2" },
  { id: "belt", labelKey: "inventorySlotBelt", className: "inventory-equipment-slot--belt" },
  { id: "bag", labelKey: "inventorySlotBag", className: "inventory-equipment-slot--bag" },
];

const sortOptions: Array<{ id: InventorySort; labelKey: TranslationKey }> = [
  { id: "recent", labelKey: "inventorySortRecent" },
  { id: "name", labelKey: "inventorySortName" },
  { id: "weight", labelKey: "inventorySortWeight" },
  { id: "value", labelKey: "inventorySortValue" },
  { id: "quantity", labelKey: "inventorySortQuantity" },
  { id: "rarity", labelKey: "inventorySortRarity" },
];

const rarityRank = {
  common: 1,
  uncommon: 2,
  rare: 3,
  unique: 4,
  epic: 5,
  legendary: 6,
} satisfies Record<InventoryItem["rarity"], number>;

const bonusLabels: Record<InventoryBonusKey, TranslationKey> = {
  attack: "inventoryAttack",
  blockChance: "inventoryBlockChance",
  defense: "inventoryDefense",
  evasion: "inventoryEvasion",
};

const weaponTypeLabelKeys: Record<WeaponType, TranslationKey> = {
  oneHandedSword: "weapon.oneHandedSword",
  twoHandedSword: "weapon.twoHandedSword",
  dagger: "weapon.dagger",
  axe: "weapon.axe",
  mace: "weapon.mace",
  club: "weapon.club",
  bow: "weapon.bow",
  staff: "weapon.staff",
  unarmed: "weapon.unarmed",
};

const ANARIEL_INVENTORY_FALLBACK_IMAGE =
  "/assets/companions/anariel/anariel_travel_rags.png";

const ANARIEL_INVENTORY_IMAGE_BY_OUTFIT_STAGE: Record<
  NonNullable<PlayerCharacter["currentOutfitStage"]>,
  string
> = {
  rags: ANARIEL_INVENTORY_FALLBACK_IMAGE,
  clothes: "/assets/companions/anariel/anariel_travel_clothes.png",
  armor: "/assets/companions/anariel/anariel_travel_armor.png",
};

function translate(key: string) {
  return t(key as TranslationKey);
}

function getRarityKey(rarity: InventoryItem["rarity"]): TranslationKey {
  return `inventoryRarity${rarity[0].toUpperCase()}${rarity.slice(1)}` as TranslationKey;
}

function getSlotLabelKey(slot: EquipmentSlot): TranslationKey {
  return equipmentSlots.find((equipmentSlot) => equipmentSlot.id === slot)?.labelKey ?? "inventoryEmptySlot";
}

function getClassKey(player?: PlayerCharacter): TranslationKey {
  if (player?.characterClass === "rogue") {
    return "classRogue";
  }

  if (player?.characterClass === "mage") {
    return "classMage";
  }

  return "classWarrior";
}

function getRaceKey(player?: PlayerCharacter): TranslationKey {
  if (player?.race === "elf") {
    return "raceElf";
  }

  if (player?.race === "dwarf") {
    return "raceDwarf";
  }

  if (player?.race === "orc") {
    return "raceOrc";
  }

  return "raceHuman";
}

function getOriginKey(player?: PlayerCharacter): TranslationKey {
  if (player?.origin === "deserter") {
    return "originDeserter";
  }

  if (player?.origin === "hunter") {
    return "originHunter";
  }

  if (player?.origin === "scholar") {
    return "originScholar";
  }

  if (player?.origin === "outcast") {
    return "originOutcast";
  }

  return "originPrisoner";
}

function getInventoryWeight(items: InventoryItem[]) {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}

function getLoadStateKey(currentWeight: number, maxWeight: number): TranslationKey {
  const ratio = currentWeight / maxWeight;

  if (ratio >= 1) {
    return "inventoryOverloaded";
  }

  if (ratio >= 0.8) {
    return "inventoryHeavyLoad";
  }

  if (ratio >= 0.5) {
    return "inventoryMediumLoad";
  }

  return "inventoryLightLoad";
}

function getEquippedItemForSlot(
  item: InventoryItem | null,
  equipment: Partial<Record<EquipmentSlot, string>>,
  items: InventoryItem[],
) {
  if (!item?.slot) {
    return null;
  }

  const equippedItemId = equipment[item.slot];
  return equippedItemId ? items.find((inventoryItem) => inventoryItem.id === equippedItemId) ?? null : null;
}

function getBonusValue(item: InventoryItem | null, bonusKey: InventoryBonusKey) {
  return item?.bonuses?.[bonusKey] ?? 0;
}

function getItemComparison(item: InventoryItem | null, equippedItem: InventoryItem | null) {
  if (!item?.equippable || !item.slot) {
    return [];
  }

  const bonusRows = (Object.keys(bonusLabels) as InventoryBonusKey[])
    .map((bonusKey) => ({
      key: bonusKey,
      labelKey: bonusLabels[bonusKey],
      value: getBonusValue(item, bonusKey) - getBonusValue(equippedItem, bonusKey),
    }))
    .filter((row) => row.value !== 0);
  const weightDelta = item.weight - (equippedItem?.weight ?? 0);
  const valueDelta = item.value - (equippedItem?.value ?? 0);

  return [
    ...bonusRows,
    ...(weightDelta !== 0 ? [{ key: "weight", labelKey: "inventoryWeight" as TranslationKey, value: weightDelta }] : []),
    ...(valueDelta !== 0 ? [{ key: "value", labelKey: "inventoryValue" as TranslationKey, value: valueDelta }] : []),
  ];
}

function getSortedItems(items: InventoryItem[], sortBy: InventorySort) {
  const sortedItems = [...items];

  if (sortBy === "name") {
    return sortedItems.sort((first, second) => translate(first.nameKey).localeCompare(translate(second.nameKey)));
  }

  if (sortBy === "weight") {
    return sortedItems.sort((first, second) => second.weight * second.quantity - first.weight * first.quantity);
  }

  if (sortBy === "value") {
    return sortedItems.sort((first, second) => second.value - first.value);
  }

  if (sortBy === "quantity") {
    return sortedItems.sort((first, second) => second.quantity - first.quantity);
  }

  if (sortBy === "rarity") {
    return sortedItems.sort((first, second) => rarityRank[second.rarity] - rarityRank[first.rarity]);
  }

  return sortedItems;
}

function shouldShowAnarielCompanion(save: GameSave | null) {
  const anariel = save?.companions?.anariel;

  return Boolean(
    anariel?.isTravellingWithPlayer ||
      anariel?.status === "companion" ||
      anariel?.status === "rescued",
  );
}

function getAnarielInventoryImage(save: GameSave | null) {
  const outfitStage = save?.player.currentOutfitStage ?? "rags";

  return ANARIEL_INVENTORY_IMAGE_BY_OUTFIT_STAGE[outfitStage] ?? ANARIEL_INVENTORY_FALLBACK_IMAGE;
}

function canUseInventoryItem(item: InventoryItem | null) {
  return Boolean(item?.canUse || item?.effectType);
}

export function Inventory({ onBackToMenu, onOpenMap }: InventoryProps) {
  const loadedSave = loadGame();
  const [currentSave, setCurrentSave] = useState<GameSave | null>(loadedSave);
  const [inventory, setInventory] = useState<InventoryState>(() => loadedSave?.inventory ?? createDefaultInventoryState());
  const [isAnarielImageMissing, setIsAnarielImageMissing] = useState(false);
  const player = currentSave?.player;
  const items = inventory.items;
  const equipment = inventory.equipment;
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id ?? null);
  const [selectedSlotId, setSelectedSlotId] = useState<EquipmentSlot | null>(null);
  const [sortBy, setSortBy] = useState<InventorySort>("recent");
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [inventoryMessage, setInventoryMessage] = useState("");

  const equippedItemIds = useMemo(() => new Set(Object.values(equipment).filter(Boolean)), [equipment]);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const hoveredItem = hoveredItemId ? items.find((item) => item.id === hoveredItemId) ?? null : null;
  const selectedEquippedComparisonItem = getEquippedItemForSlot(selectedItem, equipment, items);
  const selectedComparisonRows = getItemComparison(selectedItem, selectedEquippedComparisonItem);
  const hoveredEquippedComparisonItem = getEquippedItemForSlot(hoveredItem, equipment, items);
  const hoveredComparisonRows = getItemComparison(hoveredItem, hoveredEquippedComparisonItem);
  const filteredItems = items.filter((item) => {
    if (selectedCategory === "all") {
      return true;
    }

    if (selectedCategory === "equipped") {
      return equippedItemIds.has(item.id);
    }

    if (selectedCategory === "backpack") {
      return !equippedItemIds.has(item.id) && !item.isQuestItem;
    }

    return item.category === selectedCategory;
  });
  const sortedItems = getSortedItems(filteredItems, sortBy);
  const currentWeight = getInventoryWeight(items);
  const maxWeight = inventory.maxCarryWeight;
  const weightRatio = Math.min(100, (currentWeight / maxWeight) * 100);
  const isOverloaded = currentWeight >= maxWeight;
  const attributes = player?.attributes;
  const health = player?.derivedStats.health ?? 100;
  const stamina = player?.derivedStats.stamina ?? 100;
  const armorClass = player?.derivedStats.armorClass ?? 10;
  const dexterity = attributes?.dexterity ?? 10;
  const strength = attributes?.strength ?? 10;
  const constitution = attributes?.constitution ?? 10;
  const level = 12;
  const experienceCurrent = 23460;
  const experienceMax = 28000;
  const attack = 90 + strength * 5;
  const defense = armorClass * 18 + constitution * 4;
  const criticalChance = Math.max(5, dexterity + 6);
  const criticalDamage = 140 + dexterity * 2;
  const evasion = Math.max(8, dexterity + 10);
  const blockChance = Math.max(5, Math.round((strength + constitution) / 2));
  const showAnariel = shouldShowAnarielCompanion(currentSave);
  const anarielInventoryImage = getAnarielInventoryImage(currentSave);
  const training = player?.training;

  const persistInventory = (nextInventory: InventoryState, messageKey?: TranslationKey) => {
    setInventory(nextInventory);

    if (currentSave) {
      const nextSave = { ...currentSave, inventory: nextInventory };
      saveGame(nextSave);
      setCurrentSave(nextSave);
    }

    if (messageKey) {
      setInventoryMessage(t(messageKey));
    }
  };

  const persistSaveState = (nextSave: GameSave, messageKey?: TranslationKey) => {
    saveGame(nextSave);
    setCurrentSave(nextSave);
    setInventory(nextSave.inventory ?? createDefaultInventoryState());

    if (messageKey) {
      setInventoryMessage(t(messageKey));
    }
  };

  const updateItemQuantity = (itemId: string, nextQuantity: number, messageKey: TranslationKey) => {
    const nextItems = items
      .filter((item) => item.id !== itemId || nextQuantity > 0)
      .map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item));
    const nextEquipment = { ...equipment };

    if (nextQuantity <= 0) {
      for (const slotId of Object.keys(nextEquipment) as EquipmentSlot[]) {
        if (nextEquipment[slotId] === itemId) {
          delete nextEquipment[slotId];
        }
      }

      setSelectedItemId((currentSelectedItemId) =>
        currentSelectedItemId === itemId ? nextItems[0]?.id ?? null : currentSelectedItemId,
      );
    }

    persistInventory({ ...inventory, equipment: nextEquipment, items: nextItems }, messageKey);
  };

  const handleUseItem = () => {
    if (!selectedItem || !canUseInventoryItem(selectedItem)) {
      return;
    }

    if (selectedItem.effectType === "readText" && selectedItem.templateId === "torn_note") {
      setInventoryMessage(t("inventoryUseTornNote"));
      return;
    }

    if (selectedItem.effectType === "readText" && selectedItem.templateId === "sealed_letter") {
      setInventoryMessage(t("inventory.sealedLetterText"));
      return;
    }

    if (selectedItem.effectType === "lockpick") {
      setInventoryMessage(t("inventory.noLockHere"));
      return;
    }

    if (selectedItem.effectType === "lightSource") {
      updateItemQuantity(selectedItem.id, selectedItem.quantity - 1, "inventory.torchLit");
      return;
    }

    if (selectedItem.effectType === "restoreMana") {
      setInventoryMessage(t("inventory.noMagicKnowledge"));
      return;
    }

    if (selectedItem.effectType === "convertToGold") {
      const nextItems = items
        .map((item) => (item.id === selectedItem.id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0);
      const nextInventory = {
        ...inventory,
        gold: inventory.gold + (selectedItem.effectValue ?? 5),
        items: nextItems,
      };

      persistInventory(nextInventory, "inventoryUseCoinPouch");
      return;
    }

    if (selectedItem.effectType === "restoreHealth" || selectedItem.effectType === "restoreEnergy" || selectedItem.effectType === "stopBleeding") {
      const healAmount =
        selectedItem.effectType === "restoreHealth"
          ? selectedItem.effectValue ?? 1
          : selectedItem.effectType === "stopBleeding"
            ? 1
            : 1;
      const nextItems = items
        .map((item) => (item.id === selectedItem.id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0);
      const playerCombat = currentSave?.player.combat;

      if (currentSave && playerCombat) {
        persistSaveState({
          ...currentSave,
          inventory: {
            ...inventory,
            items: nextItems,
          },
          player: {
            ...currentSave.player,
            combat: {
              ...playerCombat,
              currentHealth: Math.min(playerCombat.maxHealth, playerCombat.currentHealth + healAmount),
            },
          },
        }, selectedItem.effectType === "stopBleeding" ? "inventoryUseBandage" : selectedItem.templateId === "stale_bread" ? "inventoryUseStaleBread" : "inventoryUseHealingHerb");
        return;
      }
    }

    updateItemQuantity(selectedItem.id, selectedItem.quantity - 1, "inventoryItemUsed");
  };

  const handleEquipItem = () => {
    if (!selectedItem?.equippable || !selectedItem.slot) {
      return;
    }

    const nextEquipment = { ...equipment };

    if (nextEquipment[selectedItem.slot] === selectedItem.id) {
      delete nextEquipment[selectedItem.slot];
      persistInventory({ ...inventory, equipment: nextEquipment }, "inventoryItemUnequipped");
      return;
    }

    nextEquipment[selectedItem.slot] = selectedItem.id;

    if (selectedItem.outfitStageOnEquip && currentSave) {
      persistSaveState({
        ...currentSave,
        inventory: { ...inventory, equipment: nextEquipment },
        player: {
          ...currentSave.player,
          currentOutfitStage: selectedItem.outfitStageOnEquip,
          unlockedOutfitStages: Array.from(new Set([...(currentSave.player.unlockedOutfitStages ?? ["rags"]), selectedItem.outfitStageOnEquip])),
        },
      }, "inventoryItemEquipped");
      return;
    }

    persistInventory({ ...inventory, equipment: nextEquipment }, "inventoryItemEquipped");
  };

  const handleDropItem = () => {
    if (!selectedItem) {
      return;
    }

    if (selectedItem.isQuestItem) {
      setInventoryMessage(t("inventoryCannotDropQuestItem"));
      return;
    }

    updateItemQuantity(selectedItem.id, selectedItem.quantity - 1, "inventoryItemDropped");
  };

  const handleDropAll = () => {
    if (!selectedItem) {
      return;
    }

    if (selectedItem.isQuestItem) {
      setInventoryMessage(t("inventoryCannotDropQuestItem"));
      return;
    }

    updateItemQuantity(selectedItem.id, 0, "inventoryItemDropped");
  };

  return (
    <section className="inventory-screen" aria-labelledby="inventory-title">
      <header className="inventory-top-nav">
        <h1 id="inventory-title" className="inventory-screen__title">
          {t("inventoryTitle")}
        </h1>
        <nav className="inventory-top-nav__items" aria-label={t("inventoryTopNavigation")}>
          <button className="inventory-top-nav-item inventory-top-nav-item--active" type="button">
            {t("inventoryTitle")}
          </button>
          <button className="inventory-top-nav-item" type="button" disabled>
            {t("inventoryCharacter")}
          </button>
          <button className="inventory-top-nav-item" type="button" disabled>
            {t("journalTitle")}
          </button>
          <button className="inventory-top-nav-item" type="button" onClick={onOpenMap}>
            {t("inventoryMap")}
          </button>
          <button className="inventory-top-nav-item" type="button" disabled>
            {t("inventoryQuests")}
          </button>
        </nav>
        <div className="inventory-top-nav__resources" aria-label={t("inventoryResources")}>
          <span>{t("inventoryGold")}: {inventory.gold.toLocaleString()}</span>
          <span>{t("inventorySilver")}: 1,250</span>
          <span>{t("inventoryBloodShard")}: 0</span>
          <button className="inventory-top-nav__icon-button" type="button" aria-label={t("inventoryBag")}>
            ◇
          </button>
          <button className="inventory-top-nav__icon-button" type="button" aria-label={t("journalTitle")}>
            ◈
          </button>
          <button className="inventory-top-nav__icon-button" type="button" onClick={onBackToMenu} aria-label={t("backToMenu")}>
            ×
          </button>
        </div>
      </header>

      <div className="inventory-layout">
        <aside className="inventory-left-panel">
          <div className="inventory-hero-card">
            <span className="inventory-hero-card__crest" aria-hidden="true">
              AI
            </span>
            <div>
              <h2>{player?.name ?? t("traveler")}</h2>
              <p>
                {t(getRaceKey(player))} • {t(getClassKey(player))}
              </p>
              <p>
                {t("inventoryLevel")} {level} • {t(getOriginKey(player))}
              </p>
            </div>
          </div>

          <div className="inventory-resource-bar" aria-label={t("inventoryExperience")}>
            <span>{experienceCurrent.toLocaleString()} / {experienceMax.toLocaleString()}</span>
            <div>
              <i style={{ width: `${(experienceCurrent / experienceMax) * 100}%` }} />
            </div>
          </div>

          <div className="inventory-stats inventory-stats--attributes">
            {[
              ["STR", attributes?.strength ?? 10],
              ["DEX", attributes?.dexterity ?? 10],
              ["VIT", attributes?.constitution ?? 10],
              ["INT", attributes?.intelligence ?? 10],
              ["WIS", attributes?.wisdom ?? 10],
              ["CHA", attributes?.charisma ?? 10],
            ].map(([label, value]) => (
              <div className="inventory-stat-orb" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{Number(value) >= 10 ? "+" : ""}{Math.floor((Number(value) - 10) / 2)}</small>
              </div>
            ))}
          </div>

          <dl className="inventory-stats inventory-stats--secondary">
            <div>
              <dt>{t("health")}</dt>
              <dd>{health} / {health}</dd>
            </div>
            <div>
              <dt>{t("stamina")}</dt>
              <dd>{stamina} / {stamina}</dd>
            </div>
            <div>
              <dt>{t("inventoryEnergy")}</dt>
              <dd>{currentSave?.travelEnergy?.currentEnergy ?? 100} / {currentSave?.travelEnergy?.maxEnergy ?? 100}</dd>
            </div>
            <div>
              <dt>{t("inventoryAttack")}</dt>
              <dd>{attack}</dd>
            </div>
            <div>
              <dt>{t("inventoryDefense")}</dt>
              <dd>{defense}</dd>
            </div>
            <div>
              <dt>{t("inventoryCriticalChance")}</dt>
              <dd>{criticalChance}%</dd>
            </div>
            <div>
              <dt>{t("inventoryCriticalDamage")}</dt>
              <dd>{criticalDamage}%</dd>
            </div>
            <div>
              <dt>{t("inventoryEvasion")}</dt>
              <dd>{evasion}%</dd>
            </div>
            <div>
              <dt>{t("inventoryBlockChance")}</dt>
              <dd>{blockChance}%</dd>
            </div>
          </dl>

          <div className="inventory-carry">
            <span>{t("inventoryCarryWeight")}</span>
            <strong>{currentWeight.toFixed(1)} / {maxWeight.toFixed(1)} kg</strong>
            <div className="inventory-weight-bar">
              <i style={{ width: `${weightRatio}%` }} />
            </div>
            <p>{t(getLoadStateKey(currentWeight, maxWeight))}</p>
            {isOverloaded ? <p className="inventory-load-warning">{t("inventoryOverloadedWarning")}</p> : null}
          </div>

          <div className="training-skills-panel">
            <h3>{t("training.weaponSkills")}</h3>
            {WEAPON_TRAINING_ORDER.slice(0, 5).map((weaponType) => {
              const isTrained = Boolean(training?.weapons[weaponType]);

              return (
                <div className="training-skill-row" key={weaponType}>
                  <span>{t(weaponTypeLabelKeys[weaponType])}</span>
                  <strong className="training-skill-status">
                    {t(isTrained ? "training.trained" : "training.untrained")}
                  </strong>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="inventory-center-panel" aria-label={t("inventoryCharacter")}>
          <div className="inventory-character">
            <div className="inventory-character-stage">
              {showAnariel ? (
                <>
                  {isAnarielImageMissing ? (
                    <div
                      className="inventory-companion-figure inventory-companion-figure--anariel inventory-companion-figure--fallback"
                      aria-hidden="true"
                    >
                      <span>A</span>
                    </div>
                  ) : (
                    <img
                      className="inventory-companion-figure inventory-companion-figure--anariel"
                      src={anarielInventoryImage}
                      alt=""
                      draggable={false}
                      onError={(event) => {
                        if (
                          event.currentTarget.getAttribute("src") !==
                          ANARIEL_INVENTORY_FALLBACK_IMAGE
                        ) {
                          event.currentTarget.src = ANARIEL_INVENTORY_FALLBACK_IMAGE;
                          return;
                        }

                        setIsAnarielImageMissing(true);
                      }}
                    />
                  )}
                  <div className="inventory-companion-label">
                    <strong className="inventory-companion-name">
                      {t("inventory.companion.anarielName")}
                    </strong>
                    <span className="inventory-companion-status">
                      {t("inventory.companion.status")}
                    </span>
                  </div>
                </>
              ) : null}
              <div className="inventory-character-figure">
                {player?.portraitUrl ? (
                  <img src={player.portraitUrl} alt="" draggable={false} />
                ) : (
                  <span>{player?.name.slice(0, 1).toUpperCase() ?? "A"}</span>
                )}
              </div>
            </div>
            <div className="inventory-equipment-slots">
              {equipmentSlots.map((slot) => {
                const itemId = equipment[slot.id];
                const equippedItem = itemId ? items.find((item) => item.id === itemId) : null;
                const isActive = selectedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={[
                      "inventory-equipment-slot",
                      slot.className,
                      isActive ? "inventory-equipment-slot--active" : "",
                      equippedItem ? "" : "inventory-equipment-slot--empty",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setSelectedSlotId(slot.id);

                      if (equippedItem) {
                        setSelectedItemId(equippedItem.id);
                      }
                    }}
                  >
                    <span>{t(slot.labelKey)}</span>
                    <strong>{equippedItem ? equippedItem.icon : t("inventoryEmptySlot")}</strong>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="inventory-character-actions" aria-hidden="true">
            <span>†</span>
            <span>✦</span>
            <span>☥</span>
            <span>◇</span>
          </div>
        </section>

        <aside className="inventory-right-panel">
          <div className="inventory-grid-tabs" aria-label={t("inventoryCategories")}>
            {categoryTabs.map((category) => (
              <button
                key={category.id}
                type="button"
                className={[
                  "inventory-grid-tab",
                  selectedCategory === category.id ? "inventory-grid-tab--active" : "",
                  selectedCategory === category.id ? "inventory-tab-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedCategory(category.id)}
                aria-label={t(category.labelKey)}
              >
                {category.icon}
              </button>
            ))}
          </div>

          <div className="inventory-grid" aria-label={t("inventoryGrid")}>
            {sortedItems.length === 0 ? (
              <p className="inventory-empty-message">{t("inventory.empty")}</p>
            ) : null}
            {sortedItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              const isEquipped = equippedItemIds.has(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    "inventory-grid-item",
                    `rarity-${item.rarity}`,
                    `inventory-rarity-${item.rarity}`,
                    isSelected ? "inventory-grid-item--selected" : "",
                    isEquipped ? "inventory-grid-item--equipped" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedItemId(item.id)}
                  onMouseEnter={(event) => {
                    setHoveredItemId(item.id);
                    setTooltipPosition({ x: event.clientX, y: event.clientY });
                  }}
                  onMouseMove={(event) => setTooltipPosition({ x: event.clientX, y: event.clientY })}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <span className="inventory-grid-item__quantity">{item.quantity}</span>
                  <strong>{item.icon}</strong>
                  <span>{translate(item.nameKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="inventory-item-details">
            {selectedItem ? (
              <>
                <div>
                  <h2>{translate(selectedItem.nameKey)}</h2>
                  <p>{translate(selectedItem.descriptionKey)}</p>
                  {equippedItemIds.has(selectedItem.id) ? (
                    <span className="inventory-equipped-badge">{t("inventoryEquipped")}</span>
                  ) : null}
                </div>
                <dl>
                  <div>
                    <dt>{t("inventoryCategory")}</dt>
                    <dd>{t(categoryTabs.find((category) => category.id === selectedItem.category)?.labelKey ?? "inventoryCategoryMisc")}</dd>
                  </div>
                  <div>
                    <dt>{t("inventoryQuantity")}</dt>
                    <dd>{selectedItem.quantity}</dd>
                  </div>
                  <div>
                    <dt>{t("inventoryValue")}</dt>
                    <dd>{selectedItem.value}</dd>
                  </div>
                  <div>
                    <dt>{t("inventoryWeight")}</dt>
                    <dd>{(selectedItem.weight * selectedItem.quantity).toFixed(1)} kg</dd>
                  </div>
                  <div>
                    <dt>{t("inventoryRarity")}</dt>
                    <dd>{t(getRarityKey(selectedItem.rarity))}</dd>
                  </div>
                  {selectedItem.slot ? (
                    <div>
                      <dt>{t("inventorySlot")}</dt>
                      <dd>{t(getSlotLabelKey(selectedItem.slot))}</dd>
                    </div>
                  ) : null}
                  {selectedItem.bonuses ? (
                    <div>
                      <dt>{t("inventoryBonuses")}</dt>
                      <dd>
                        {Object.entries(selectedItem.bonuses)
                          .map(([bonusKey, value]) => `${t(bonusLabels[bonusKey as InventoryBonusKey])} ${Number(value) > 0 ? "+" : ""}${value}`)
                          .join(", ")}
                      </dd>
                    </div>
                  ) : null}
                  {selectedItem.weaponType ? (
                    <div className="inventory-weapon-stats">
                      <dt>{t("inventoryWeaponStats")}</dt>
                      <dd>
                        {t(weaponTypeLabelKeys[selectedItem.weaponType])} · {selectedItem.damageDice ?? "1d4"} ·{" "}
                        {t(`damage.${selectedItem.damageType ?? "bludgeoning"}` as TranslationKey)} ·{" "}
                        {t(`attribute.${selectedItem.attackAttribute ?? "strength"}` as TranslationKey)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {selectedItem.equippable ? (
                  <div className="inventory-comparison inventory-details">
                    <h3>{t("inventoryComparison")}</h3>
                    <p>
                      {t("inventoryCurrentEquipped")}:{" "}
                      {selectedEquippedComparisonItem ? translate(selectedEquippedComparisonItem.nameKey) : t("inventoryEmptySlot")}
                    </p>
                    <p>
                      {t("inventoryNewItem")}: {translate(selectedItem.nameKey)}
                    </p>
                    {selectedComparisonRows.length > 0 ? (
                      <ul>
                        {selectedComparisonRows.map((row) => (
                          <li
                            key={row.key}
                            className={
                              row.value >= 0
                                ? "inventory-comparison-positive"
                                : "inventory-comparison-negative"
                            }
                          >
                            {t(row.labelKey)}: {row.value > 0 ? "+" : ""}
                            {Number.isInteger(row.value) ? row.value : row.value.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{t("inventoryNoStatChange")}</p>
                    )}
                  </div>
                ) : null}
                <p className="inventory-action-availability">
                  {selectedItem.isQuestItem
                    ? t("inventoryQuestItemLocked")
                    : selectedItem.category === "consumable"
                      ? t("inventoryActionUseAvailable")
                      : selectedItem.equippable
                        ? t("inventoryActionEquipAvailable")
                        : t("inventoryActionDropAvailable")}
                </p>
                {inventoryMessage ? (
                  <p className="inventory-action-availability">{inventoryMessage}</p>
                ) : null}
              </>
            ) : (
              <p>{t("inventorySelectItem")}</p>
            )}
          </div>

          <div className="inventory-bottom-actions">
            <label className="inventory-sort">
              <span>{t("inventorySortBy")}</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as InventorySort)}>
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <div className="inventory-bottom-actions__weight">
              <span>{currentWeight.toFixed(1)} / {maxWeight.toFixed(1)} kg</span>
              <div className="inventory-weight-bar">
                <i style={{ width: `${weightRatio}%` }} />
              </div>
            </div>
            <button className="inventory-action-button" type="button" onClick={handleUseItem} disabled={!canUseInventoryItem(selectedItem)}>
              {t("inventoryUse")}
            </button>
            <button className="inventory-action-button" type="button" onClick={handleEquipItem} disabled={!selectedItem?.equippable}>
              {selectedItem && equippedItemIds.has(selectedItem.id) ? t("inventoryUnequip") : t("inventoryEquip")}
            </button>
            <button className="inventory-action-button" type="button" onClick={handleDropItem} disabled={!selectedItem || selectedItem.isQuestItem}>
              {t("inventoryDrop")}
            </button>
            <button className="inventory-action-button inventory-action-button--danger" type="button" onClick={handleDropAll} disabled={!selectedItem || selectedItem.isQuestItem}>
              {t("inventoryDropAll")}
            </button>
          </div>
        </aside>
      </div>
      {hoveredItem ? (
        <div
          className={["inventory-tooltip", `inventory-rarity-${hoveredItem.rarity}`].join(" ")}
          style={{
            left: Math.min(tooltipPosition.x + 18, window.innerWidth - 340),
            top: Math.min(tooltipPosition.y + 18, window.innerHeight - 360),
          }}
        >
          <h2 className="inventory-tooltip-title">{translate(hoveredItem.nameKey)}</h2>
          <div className="inventory-tooltip-row">
            <span>{t("inventoryCategory")}</span>
            <strong>{t(categoryTabs.find((category) => category.id === hoveredItem.category)?.labelKey ?? "inventoryCategoryMisc")}</strong>
          </div>
          <div className="inventory-tooltip-row">
            <span>{t("inventoryRarity")}</span>
            <strong>{t(getRarityKey(hoveredItem.rarity))}</strong>
          </div>
          <p>{translate(hoveredItem.descriptionKey)}</p>
          <div className="inventory-tooltip-row">
            <span>{t("inventoryWeight")}</span>
            <strong>{(hoveredItem.weight * hoveredItem.quantity).toFixed(1)} kg</strong>
          </div>
          <div className="inventory-tooltip-row">
            <span>{t("inventoryValue")}</span>
            <strong>{hoveredItem.value}</strong>
          </div>
          <div className="inventory-tooltip-row">
            <span>{t("inventoryQuantity")}</span>
            <strong>{hoveredItem.quantity}</strong>
          </div>
          {hoveredItem.slot ? (
            <div className="inventory-tooltip-row">
              <span>{t("inventorySlot")}</span>
              <strong>{t(getSlotLabelKey(hoveredItem.slot))}</strong>
            </div>
          ) : null}
          {hoveredItem.bonuses ? (
            <div className="inventory-tooltip-row">
              <span>{t("inventoryBonuses")}</span>
              <strong>
                {Object.entries(hoveredItem.bonuses)
                  .map(([bonusKey, value]) => `${t(bonusLabels[bonusKey as InventoryBonusKey])} ${Number(value) > 0 ? "+" : ""}${value}`)
                  .join(", ")}
              </strong>
            </div>
          ) : null}
          {hoveredItem.equippable ? (
            <div className="inventory-comparison">
              <h3>{t("inventoryComparison")}</h3>
              <p>
                {t("inventoryCurrentEquipped")}:{" "}
                {hoveredEquippedComparisonItem ? translate(hoveredEquippedComparisonItem.nameKey) : t("inventoryEmptySlot")}
              </p>
              <p>
                {t("inventoryNewItem")}: {translate(hoveredItem.nameKey)}
              </p>
              {hoveredComparisonRows.length > 0 ? (
                <ul>
                  {hoveredComparisonRows.map((row) => (
                    <li
                      key={row.key}
                      className={row.value >= 0 ? "inventory-comparison-positive" : "inventory-comparison-negative"}
                    >
                      {t(row.labelKey)}: {row.value > 0 ? "+" : ""}
                      {Number.isInteger(row.value) ? row.value : row.value.toFixed(1)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("inventoryNoStatChange")}</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
