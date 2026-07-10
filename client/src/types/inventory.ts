export type InventoryCategory =
  | "all"
  | "equipped"
  | "backpack"
  | "armor"
  | "weapons"
  | "consumables"
  | "materials"
  | "quest"
  | "misc";

export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipmentSlot =
  | "head"
  | "chest"
  | "rightHand"
  | "leftHand"
  | "back"
  | "accessory1"
  | "accessory2"
  | "belt"
  | "bag";

export type InventoryItem = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: Exclude<InventoryCategory, "all" | "equipped" | "backpack">;
  rarity: InventoryRarity;
  value: number;
  weight: number;
  quantity: number;
  equippable: boolean;
  slot?: EquipmentSlot;
  icon: string;
  bonuses?: Partial<Record<"attack" | "defense" | "evasion" | "blockChance", number>>;
  questItem?: boolean;
};
