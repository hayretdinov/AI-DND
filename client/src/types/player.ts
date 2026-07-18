import type { CombatStats, PlayerTraining } from "./combat";
import type { PlayerMagicState } from "../systems/magic/magicTypes";
import type { PlayerTextCombatState } from "../systems/combat/text/combatTextTypes";
import type { TrainerProgressionState } from "../systems/trainers/trainerTypes";
import type { SmithingProgressionState } from "../systems/smithing/smithingTypes";

export type PlayerOrigin = "prisoner" | "deserter" | "hunter" | "scholar" | "outcast";
export type PlayerRace = "human" | "elf" | "dwarf" | "orc";
export type PlayerGender = "male" | "female";
export type PlayerClass = "warrior" | "rogue" | "mage";
export type PlayerAppearance = "wanderer" | "iron" | "ash";
export type PlayerOutfitStage = "rags" | "clothes" | "armor";
export type PlayerLifeState = "active" | "defeated" | "robbed" | "dead";

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
  currentOutfitStage: PlayerOutfitStage;
  unlockedOutfitStages?: PlayerOutfitStage[];
  portraitUrl: string;
  baseAttributes?: Attributes;
  allocatedAttributes?: Attributes;
  racialModifiers?: Attributes;
  statsSchemaVersion?: number;
  attributes: Attributes;
  derivedStats: DerivedStats;
  lifeState?: PlayerLifeState;
  combat?: CombatStats;
  training?: PlayerTraining;
  magic?: PlayerMagicState;
  textCombat?: PlayerTextCombatState;
  trainerProgression?: TrainerProgressionState;
  smithing?: SmithingProgressionState;
  createdAt: string;
};
