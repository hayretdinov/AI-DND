export type InventoryCategory =
  | "all"
  | "equipped"
  | "backpack"
  | "weapon"
  | "armor"
  | "consumable"
  | "material"
  | "quest"
  | "misc";

export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipmentSlot =
  | "head"
  | "chest"
  | "mainHand"
  | "offHand"
  | "back"
  | "amulet"
  | "ring1"
  | "ring2"
  | "belt"
  | "bag"
  | "gloves"
  | "boots";

export type ItemStats = Partial<Record<"attack" | "defense" | "evasion" | "blockChance", number>>;

export type InventoryItem = {
  id: string;
  templateId: string;
  nameKey: string;
  descriptionKey: string;
  category: Exclude<InventoryCategory, "all" | "equipped" | "backpack">;
  rarity: InventoryRarity;
  quantity: number;
  weight: number;
  value: number;
  equippable: boolean;
  slot?: EquipmentSlot;
  stats?: ItemStats;
  icon: string;
  bonuses?: ItemStats;
  isQuestItem?: boolean;
  questItem?: boolean;
  createdAt: string;
};

export type EquipmentState = Partial<Record<EquipmentSlot, string>>;

export type InventoryState = {
  items: InventoryItem[];
  equipment: EquipmentState;
  gold: number;
  maxCarryWeight: number;
};
