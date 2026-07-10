export type PlayerOrigin = "prisoner" | "deserter" | "hunter" | "scholar" | "outcast";
export type PlayerRace = "human" | "elf" | "dwarf" | "orc";
export type PlayerGender = "male" | "female";
export type PlayerClass = "warrior" | "rogue" | "mage";
export type PlayerAppearance = "wanderer" | "iron" | "ash";

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
  race: PlayerRace;
  gender: PlayerGender;
  characterClass: PlayerClass;
  appearance: PlayerAppearance;
  portraitUrl: string;
  attributes: Attributes;
  derivedStats: DerivedStats;
  createdAt: string;
};
