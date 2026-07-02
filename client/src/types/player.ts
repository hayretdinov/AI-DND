export type PlayerOrigin = "prisoner" | "deserter" | "hunter" | "scholar" | "outcast";

export type Attributes = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type DerivedStats = {
  health: number;
  stamina: number;
  armorClass: number;
};

export type PlayerCharacter = {
  id: string;
  name: string;
  origin: PlayerOrigin;
  attributes: Attributes;
  derivedStats: DerivedStats;
  createdAt: string;
};
