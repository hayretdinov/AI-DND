import type {
  AttackDirection,
  AttackPower,
  AttackTempo,
  AttackType,
  BodyZone,
  CombatDistance,
  CombatIntent,
  CombatMovement,
  CombatStance,
  CombatTechniqueId,
  WeaponCategory,
  WeaponGrip,
} from "./combatTextTypes";

export type PhraseEntry<T extends string> = {
  value: T;
  phrases: string[];
};

export function normalizeCombatText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,!?;:()[\]"]/g, " ")
    .replace(/\s+/g, " ");
}

export const INTENT_PHRASES: Array<PhraseEntry<CombatIntent>> = [
  { value: "attack", phrases: ["атак", "напад", "бью", "удар", "наношу удар", "пинаю", "strike", "attack", "hit"] },
  { value: "weaponStrike", phrases: ["руб", "реж", "кол", "выпад", "slash", "stab", "thrust", "swing"] },
  { value: "block", phrases: ["блок", "закрываюсь", "поднимаю щит", "block"] },
  { value: "parry", phrases: ["парир", "отвожу клинок", "parry"] },
  { value: "dodge", phrases: ["уворач", "отскак", "ныряю", "dodge", "evade", "sidestep"] },
  { value: "counterattack", phrases: ["контратак", "ответн", "riposte", "counter"] },
  { value: "feint", phrases: ["финт", "обман", "feint"] },
  { value: "disarm", phrases: ["выбить оруж", "обезоруж", "disarm"] },
  { value: "trip", phrases: ["подсеч", "сбить с ног", "trip", "sweep"] },
  { value: "shove", phrases: ["толк", "отталк", "push", "shove"] },
  { value: "grapple", phrases: ["хвата", "захват", "борюсь", "grapple", "grab"] },
  { value: "breakGrapple", phrases: ["вырваться", "освободиться от захвата", "break grapple"] },
  { value: "closeDistance", phrases: ["сближаюсь", "шагаю вперед", "подхожу", "close distance"] },
  { value: "increaseDistance", phrases: ["отступ", "отхожу", "разрываю дистанцию", "back away"] },
  { value: "holdDistance", phrases: ["держу дистанцию", "hold distance"] },
  { value: "guard", phrases: ["стойка", "гарда", "держу защиту", "guard"] },
  { value: "readyAction", phrases: ["готовлюсь", "жду атаки", "ready"] },
  { value: "shieldBash", phrases: ["бью щитом", "удар щитом", "shield bash"] },
  { value: "pommelStrike", phrases: ["бью навершием", "pommel"] },
  { value: "breakGuard", phrases: ["ломаю защиту", "пробиваю блок", "break guard"] },
  { value: "escape", phrases: ["убег", "flee", "escape"] },
  { value: "pickUpWeapon", phrases: ["поднимаю оружие", "pick up weapon"] },
  { value: "switchWeapon", phrases: ["меняю оружие", "switch weapon"] },
  { value: "throwWeapon", phrases: ["метаю оружие", "бросаю оружие", "throw weapon"] },
];

export const ATTACK_TYPE_PHRASES: Array<PhraseEntry<AttackType>> = [
  { value: "slash", phrases: ["рубящ", "режущ", "режу", "slash", "cut"] },
  { value: "thrust", phrases: ["колющ", "колю", "укол", "выпад", "stab", "thrust"] },
  { value: "chop", phrases: ["рублю", "топором", "chop"] },
  { value: "bash", phrases: ["дроб", "бью", "оглуш", "bash", "smash"] },
  { value: "pommel", phrases: ["навершием", "pommel"] },
  { value: "kick", phrases: ["пинок", "пинаю", "ногой", "kick"] },
  { value: "punch", phrases: ["кулак", "кулаком", "punch"] },
  { value: "hook", phrases: ["крюк", "зацеп", "hook"] },
];

export const WEAPON_PHRASES: Array<PhraseEntry<WeaponCategory>> = [
  { value: "twoHandedSword", phrases: ["двуручный меч", "greatsword"] },
  { value: "sword", phrases: ["меч", "клинок", "sword"] },
  { value: "dagger", phrases: ["кинжал", "dagger"] },
  { value: "knife", phrases: ["нож", "knife"] },
  { value: "axe", phrases: ["топор", "axe"] },
  { value: "mace", phrases: ["булава", "mace"] },
  { value: "hammer", phrases: ["молот", "hammer"] },
  { value: "club", phrases: ["дубина", "палица", "club"] },
  { value: "spear", phrases: ["копье", "копьем", "копь", "spear"] },
  { value: "bow", phrases: ["лук", "стрела", "bow"] },
  { value: "staff", phrases: ["посох", "staff"] },
  { value: "shield", phrases: ["щит", "shield"] },
  { value: "unarmed", phrases: ["кулак", "руками", "без оружия", "unarmed"] },
  { value: "improvised", phrases: ["бутыл", "камень", "палка", "improvised"] },
  { value: "throwing", phrases: ["метаю", "бросаю", "throw"] },
];

export const BODY_ZONE_PHRASES: Array<PhraseEntry<BodyZone>> = [
  { value: "head", phrases: ["голов", "лицо", "глаз", "head", "face"] },
  { value: "neck", phrases: ["шею", "шеи", "горло", "neck", "throat"] },
  { value: "torso", phrases: ["корпус", "тело", "torso", "body"] },
  { value: "chest", phrases: ["груд", "chest"] },
  { value: "abdomen", phrases: ["живот", "брюхо", "abdomen", "belly"] },
  { value: "leftArm", phrases: ["левую руку", "левая рука", "left arm"] },
  { value: "rightArm", phrases: ["правую руку", "правая рука", "right arm"] },
  { value: "leftHand", phrases: ["левую кисть", "left hand"] },
  { value: "rightHand", phrases: ["правую кисть", "right hand"] },
  { value: "leftLeg", phrases: ["левую ногу", "левая нога", "left leg"] },
  { value: "rightLeg", phrases: ["правую ногу", "правая нога", "right leg"] },
  { value: "weapon", phrases: ["оружие", "мечу", "клинку", "weapon"] },
  { value: "shield", phrases: ["щиту", "shield"] },
];

export const DIRECTION_PHRASES: Array<PhraseEntry<AttackDirection>> = [
  { value: "overhead", phrases: ["сверху", "над головой", "overhead"] },
  { value: "left", phrases: ["слева", "налево", "left"] },
  { value: "right", phrases: ["справа", "направо", "right"] },
  { value: "low", phrases: ["снизу", "низко", "low"] },
  { value: "straight", phrases: ["прямо", "вперед", "straight"] },
  { value: "rising", phrases: ["восходящ", "снизу вверх", "rising"] },
];

export const POWER_PHRASES: Array<PhraseEntry<AttackPower>> = [
  { value: "light", phrases: ["легк", "коротк", "быстро", "light"] },
  { value: "heavy", phrases: ["сильн", "мощн", "тяжел", "heavy", "powerful"] },
  { value: "allOut", phrases: ["изо всех сил", "всем весом", "all out"] },
];

export const TEMPO_PHRASES: Array<PhraseEntry<AttackTempo>> = [
  { value: "quick", phrases: ["резко", "быстро", "коротко", "quick", "fast"] },
  { value: "slow", phrases: ["медленно", "выжидая", "slow"] },
];

export const GRIP_PHRASES: Array<PhraseEntry<WeaponGrip>> = [
  { value: "oneHanded", phrases: ["одной рукой", "one hand"] },
  { value: "twoHanded", phrases: ["двумя руками", "two hand"] },
  { value: "reverse", phrases: ["обратным хватом", "reverse grip"] },
  { value: "halfSword", phrases: ["полумеч", "half sword"] },
];

export const MOVEMENT_PHRASES: Array<PhraseEntry<CombatMovement>> = [
  { value: "stepForward", phrases: ["шагаю вперед", "шаг вперед", "step forward"] },
  { value: "stepBack", phrases: ["шагаю назад", "отступаю", "step back"] },
  { value: "left", phrases: ["ухожу влево", "влево"] },
  { value: "right", phrases: ["ухожу вправо", "вправо"] },
  { value: "circle", phrases: ["обхожу", "кружу", "circle"] },
  { value: "lunge", phrases: ["выпад", "lunge"] },
  { value: "rush", phrases: ["бросаюсь", "рывок", "rush"] },
];

export const DISTANCE_PHRASES: Array<PhraseEntry<CombatDistance>> = [
  { value: "grapple", phrases: ["в клинче", "в захвате", "grapple"] },
  { value: "veryClose", phrases: ["вплотную", "очень близко", "very close"] },
  { value: "melee", phrases: ["на дистанции удара", "рядом", "melee"] },
  { value: "reach", phrases: ["на длине копья", "на дистанции", "reach"] },
  { value: "medium", phrases: ["издали", "с расстояния", "medium"] },
];

export const STANCE_PHRASES: Array<PhraseEntry<CombatStance>> = [
  { value: "aggressive", phrases: ["агрессив", "давлю", "aggressive"] },
  { value: "defensive", phrases: ["оборон", "защит", "defensive"] },
  { value: "guardHigh", phrases: ["верхняя гарда", "высокая стойка", "high guard"] },
  { value: "guardLow", phrases: ["нижняя гарда", "low guard"] },
  { value: "mobile", phrases: ["подвиж", "на ногах", "mobile"] },
];

export const TECHNIQUE_PHRASES: Array<PhraseEntry<CombatTechniqueId>> = [
  { value: "basicSlash", phrases: ["рубящий удар", "slash"] },
  { value: "aimedThrust", phrases: ["точный выпад", "прицельный укол"] },
  { value: "powerChop", phrases: ["мощный рубящий", "силовой удар"] },
  { value: "shieldBash", phrases: ["удар щитом"] },
  { value: "quickParry", phrases: ["быстро парир"] },
  { value: "riposte", phrases: ["рипост", "ответный удар"] },
  { value: "disarmBind", phrases: ["обезоруживающий захват"] },
  { value: "legSweep", phrases: ["подсечка"] },
];

export const CLAIMED_OUTCOME_PHRASES = [
  "убиваю",
  "отрубаю",
  "обезглав",
  "разрубаю",
  "ломаю ему",
  "отрезаю",
  "kill",
  "decapitate",
  "cut off",
];
