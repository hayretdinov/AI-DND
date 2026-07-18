import type { AmmoCategory, RangedCombatIntent, RangedShotType, RangedStance, RangedWeaponCategory } from "./rangedCombatTypes";
import type { BodyZone, CombatMovement } from "../text";

export type PhraseEntry<T extends string> = { value: T; phrases: string[] };

export function normalizeRangedText(text: string) {
  return text.toLocaleLowerCase("ru-RU").replace(/[ё]/g, "е").replace(/[.,!?;:()"«»]/g, " ").replace(/\s+/g, " ").trim();
}

export const RANGED_INTENT_PHRASES: Array<PhraseEntry<RangedCombatIntent>> = [
  { value: "reload", phrases: ["перезаряжа", "заряжаю арбалет", "reload"] },
  { value: "aim", phrases: ["прицел", "навожу", "целюсь", "aim"] },
  { value: "quickShot", phrases: ["быстро стреляю", "навскидку", "quick shot"] },
  { value: "preciseShot", phrases: ["точно стреляю", "выцеливаю", "precise"] },
  { value: "powerShot", phrases: ["мощный выстрел", "сильный выстрел", "power shot"] },
  { value: "leadingShot", phrases: ["упреждение", "по бегущ", "leading"] },
  { value: "readyShot", phrases: ["готовлю выстрел", "когда он", "если он", "ready"] },
  { value: "takeCover", phrases: ["укрытие", "прячусь", "за камнем", "take cover"] },
  { value: "shoot", phrases: ["стреля", "выстрел", "пускаю стрелу", "shoot", "fire"] },
];

export const RANGED_WEAPON_PHRASES: Array<PhraseEntry<RangedWeaponCategory>> = [
  { value: "handCrossbow", phrases: ["ручной арбалет", "hand crossbow"] },
  { value: "lightCrossbow", phrases: ["легкий арбалет", "лёгкий арбалет", "арбалет", "light crossbow", "crossbow"] },
  { value: "huntingCrossbow", phrases: ["охотничий арбалет", "hunting crossbow"] },
  { value: "heavyCrossbow", phrases: ["тяжелый арбалет", "тяжёлый арбалет", "heavy crossbow"] },
  { value: "shortBow", phrases: ["короткий лук", "short bow"] },
  { value: "longBow", phrases: ["длинный лук", "long bow"] },
  { value: "throwingWeapon", phrases: ["метаю", "бросаю нож", "throw"] },
];

export const RANGED_AMMO_PHRASES: Array<PhraseEntry<AmmoCategory>> = [
  { value: "armorPiercingArrow", phrases: ["бронебойная стрела", "бронебойные стрелы", "armor piercing arrow"] },
  { value: "armorPiercingBolt", phrases: ["бронебой", "armor piercing"] },
  { value: "broadheadBolt", phrases: ["широк", "зазубрен", "broadhead"] },
  { value: "fireBolt", phrases: ["зажигатель", "огнен", "fire bolt"] },
  { value: "poisonBolt", phrases: ["отрав", "poison"] },
  { value: "commonBolt", phrases: ["обычн", "болт", "bolt"] },
  { value: "arrow", phrases: ["стрел", "arrow"] },
];

export const RANGED_ZONE_PHRASES: Array<PhraseEntry<BodyZone>> = [
  { value: "head", phrases: ["голов", "глаз", "лицо", "head", "eye"] },
  { value: "torso", phrases: ["корпус", "груд", "тело", "torso", "chest"] },
  { value: "leftArm", phrases: ["рук", "плеч", "arm"] },
  { value: "leftLeg", phrases: ["ног", "колен", "leg"] },
  { value: "weapon", phrases: ["оруж", "арбалет в руке", "weapon"] },
  { value: "shield", phrases: ["щит", "shield"] },
];

export const RANGED_STANCE_PHRASES: Array<PhraseEntry<RangedStance>> = [
  { value: "kneeling", phrases: ["колено", "присед", "kneel"] },
  { value: "prone", phrases: ["ложусь", "лежа", "prone"] },
  { value: "fromCover", phrases: ["из укрытия", "за бочкой", "from cover"] },
  { value: "moving", phrases: ["на бегу", "в движении", "moving"] },
];

export const RANGED_MOVEMENT_PHRASES: Array<PhraseEntry<CombatMovement>> = [
  { value: "stepBack", phrases: ["отступ", "назад", "step back"] },
  { value: "stepForward", phrases: ["сближа", "вперед", "forward"] },
  { value: "rush", phrases: ["рывком", "бегу", "rush"] },
];

export const RANGED_SHOT_TYPE_PHRASES: Array<PhraseEntry<RangedShotType>> = [
  { value: "quick", phrases: ["быстро", "навскидку"] },
  { value: "precise", phrases: ["точно", "выцел"] },
  { value: "power", phrases: ["мощн", "сильн"] },
  { value: "leading", phrases: ["упрежд", "бегущ"] },
  { value: "prepared", phrases: ["готов", "когда", "если"] },
];

export const RANGED_CLAIMED_OUTCOME_PHRASES = ["попадаю", "убиваю", "простреливаю", "сбиваю", "выбиваю"];
