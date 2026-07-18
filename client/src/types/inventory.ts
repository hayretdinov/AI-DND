import type { AttackAttribute, DamageType, WeaponType } from "./combat";
import type { Attributes } from "./player";

export type InventoryCategory =
  | "all"
  | "equipped"
  | "backpack"
  | "medicine"
  | "document"
  | "tool"
  | "clothing"
  | "shield"
  | "accessory"
  | "weapon"
  | "armor"
  | "consumable"
  | "material"
  | "quest"
  | "misc";

export type InventoryRarity = "common" | "uncommon" | "rare" | "unique" | "epic" | "legendary";

export type EquipmentSlot =
  | "head"
  | "face"
  | "neck"
  | "torso"
  | "body"
  | "cloak"
  | "chest"
  | "primaryWeapon"
  | "mainHand"
  | "secondaryWeapon"
  | "offHand"
  | "shield"
  | "rangedWeapon"
  | "back"
  | "amulet"
  | "leftRing"
  | "rightRing"
  | "ring1"
  | "ring2"
  | "belt"
  | "bag"
  | "gloves"
  | "pants"
  | "boots";

export type ItemStats = Partial<Record<"attack" | "defense" | "evasion" | "blockChance", number>>;
export type InventoryItemCondition = "intact" | "worn" | "damaged" | "broken";
export type InventoryItemQuality = "poor" | "common" | "fine";
export type ReadableContentType = "image" | "text" | "pages";
export type ItemEffectType =
  | "restoreHealth"
  | "restoreEnergy"
  | "restoreMana"
  | "stopBleeding"
  | "convertToGold"
  | "readText"
  | "lightSource"
  | "lockpick"
  | "contextual";
export type FallbackIconType =
  | "food"
  | "herb"
  | "medicine"
  | "key"
  | "note"
  | "letter"
  | "coinPouch"
  | "tool"
  | "material"
  | "clothing"
  | "weapon"
  | "shield"
  | "amulet"
  | "potion"
  | "torch";

export type InventoryItem = {
  id: string;
  instanceId?: string;
  itemId?: string;
  templateId: string;
  nameKey: string;
  descriptionKey: string;
  category: Exclude<InventoryCategory, "all" | "equipped" | "backpack">;
  rarity: InventoryRarity;
  quantity: number;
  weight: number;
  value: number;
  equippable: boolean;
  canUse?: boolean;
  canEquip?: boolean;
  slot?: EquipmentSlot;
  equipmentSlot?: EquipmentSlot;
  stats?: ItemStats;
  icon: string;
  iconUrl?: string;
  fallbackIconType?: FallbackIconType;
  bonuses?: ItemStats;
  attributeBonuses?: Partial<Attributes>;
  weaponType?: WeaponType;
  damageDice?: string;
  damageType?: DamageType;
  attackAttribute?: AttackAttribute;
  armorValue?: number;
  outfitStageOnEquip?: "rags" | "clothes" | "armor";
  effectType?: ItemEffectType;
  effectValue?: number;
  readable?: boolean;
  readContentType?: ReadableContentType;
  readAssetId?: string;
  readTitleKey?: string;
  readDescriptionKey?: string;
  craftingMaterial?: boolean;
  condition?: InventoryItemCondition;
  quality?: InventoryItemQuality;
  origin?: string;
  owner?: "player" | string;
  isQuestItem?: boolean;
  questItem?: boolean;
  cannotBeStolen?: boolean;
  createdAt: string;
};

export type EquipmentState = Partial<Record<EquipmentSlot, string>>;

export type InventoryState = {
  items: InventoryItem[];
  equipment: EquipmentState;
  gold: number;
  maxCarryWeight: number;
};
