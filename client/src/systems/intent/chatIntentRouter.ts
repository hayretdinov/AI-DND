import { parseMagicFormula } from "../magic";

export type ChatRoute =
  | "system"
  | "trade"
  | "inventory"
  | "training"
  | "trainingRequest"
  | "magic"
  | "rangedPreparation"
  | "rangedCombat"
  | "meleePreparation"
  | "meleeCombat"
  | "startCombat"
  | "worldAction"
  | "dialogue";

export type ChatClassificationResult = {
  route: ChatRoute;
  confidence: number;
  detectedIntent?: string;
  detectedWeapon?: string;
  detectedSpellFormula?: string;
  negated: boolean;
  historicalContext: boolean;
  trainingContext: boolean;
  tradeContext: boolean;
  matchedPhrases: string[];
  warnings: string[];
};

export type ChatClassificationContext = {
  npcRole?: string;
  activeTrade?: boolean;
};

const weaponPattern = /\b(меч|мечом|кинжал|кинжалом|нож|ножом|лук|лука|арбалет|арбалета|стрел[ауы]|болт|дубин[аойу]|булав[аойу]|молот|молотом|копь[её]м?|посох|посохом|топор|топором|щит|оружие|sword|dagger|knife|bow|crossbow|arrow|bolt|club|mace|hammer|spear|staff|axe|shield|weapon)\b/i;
const tradePattern = /\b(купить|покупаю|куплю|продать|продаю|продам|торг|товар|цена|стоимость|стоит|монет|золота|лавка|торгов|buy|sell|trade|price|cost|gold|merchant|shop|how much)\b/i;
const trainingPattern = /\b(научи|учусь|обуч|тренир|покажи как|как лучше|как правильно|урок|наставник|манекен|teach|learn|train|lesson|trainer|show me how)\b/i;
const historicalPattern = /\b(рассказываю|расскажи|прошл[аоые]|раньше|когда-то|вчера|видел как|видел, как|слышал как|слышал, как|что означает|что будет если|story|tell me|past|yesterday|used to|saw how|heard how|what does|what happens if)\b/i;
const inventoryPattern = /\b(инвентар|рюкзак|экипир|надеть|снять|убрать в сумку|inventory|backpack|equip|unequip)\b/i;
const negationPattern = /\b(не|нет|не хочу|не буду|не собираюсь|отменяю|перестаю|избегаю|воздерживаюсь|no|not|do not|don't|won't|avoid|cancel|stop)\b/i;
const questionPattern = /[?？]|(?:\b|^)(что|как|почему|можно|сколько|где|когда|зачем|означает|значит|объясни|what|how|why|can|could|where|when|does|mean)(?:\b|$)/i;
const magicDiscussionPattern = /\b(рассказывал|рассказывала|рассказывали|рассказал|рассказала|объяснял|объясняла|учил|учила|говорил|говорила|told|explained|taught)\b/i;

const startCombatPhrases = [
  "начинаю бой",
  "вступаю в бой",
  "начинаю сражение",
  "хочу сразиться",
  "вызываю на бой",
  "вступаю в схватку",
  "start combat",
  "begin combat",
  "challenge",
];

const meleeActionPhrases = [
  "атакую",
  "нападаю",
  "бью",
  "бью кулаком",
  "ударяю",
  "ударить",
  "наношу удар",
  "пинаю",
  "толкаю",
  "хватаю",
  "пытаюсь схватить",
  "рублю",
  "колю",
  "режу",
  "делаю выпад",
  "пытаюсь ударить",
  "замахиваюсь",
  "обезоружить",
  "attack",
  "strike",
  "hit",
  "slash",
  "stab",
  "swing",
  "lunge",
  "disarm",
];

const rangedAttackPhrases = [
  "стреляю",
  "делаю выстрел",
  "выпускаю стрелу",
  "выпускаю болт",
  "нажимаю на спуск",
  "открываю огонь",
  "shoot",
  "fire",
  "release an arrow",
  "loose an arrow",
  "pull the trigger",
];

const rangedPreparationPhrases = [
  "заряжаю арбалет",
  "перезаряжаю",
  "прицеливаюсь",
  "навожу арбалет",
  "навожу лук",
  "беру на прицел",
  "беру лук в руки",
  "накладываю стрелу",
  "натягиваю лук",
  "натягиваю тетиву",
  "reload",
  "aim",
  "take aim",
];

const meleePreparationPhrases = [
  "достаю меч",
  "достаю кинжал",
  "достаю нож",
  "достаю оружие",
  "обнажаю",
  "вынимаю меч",
  "поднимаю щит",
  "беру щит",
  "готовлю меч",
  "draw sword",
  "draw weapon",
  "raise shield",
];

const drawWeaponPhrases = [
  "убираю кинжал",
  "убираю меч",
  "прячу оружие",
  "sheathe",
];

const magicCastPhrases = [
  "произношу",
  "применяю заклинание",
  "колдую",
  "кастую",
  "читаю магическую формулу",
  "создаю огненный шар",
  "cast",
  "spell",
  "magic formula",
];

const knownMagicWords = ["игнис", "фригус", "вольтар", "террон", "аэрис", "люмен", "ноктис", "витар", "мортис", "арканум"];

function normalizeText(text: string) {
  return text.trim().toLowerCase().replace(/ё/g, "е").replace(/[«»"]/g, "");
}

function includesAny(text: string, phrases: string[]) {
  return phrases.find((phrase) => text.includes(phrase));
}

function removeNegatedCombatClauses(text: string) {
  return text
    .replace(/\bне\s+(?:хочу\s+|буду\s+|собираюсь\s+)?(?:атакую|атаковать|нападаю|стреляю|выстрелю|бью|ударяю|колю|рублю|режу|применяю|применять|произношу|колдую|начинаю бой|начинать бой)[^,.!?;]*(?=$|[,.!?;]|\s+а\s+|\s+но\s+)/gi, " ")
    .replace(/\b(?:отменяю|перестаю|избегаю|воздерживаюсь)\s+(?:от\s+)?(?:атаки|выстрела|заклинания|боя)[^,.!?;]*(?=$|[,.!?;]|\s+а\s+|\s+но\s+)/gi, " ")
    .replace(/\b(?:do not|don't|not|won't|avoid|cancel|stop)\s+(?:attack|shoot|hit|strike|cast|start combat)[^,.!?;]*(?=$|[,.!?;]|\s+but\s+)/gi, " ");
}

function detectSpellFormula(text: string) {
  const matchedWords = knownMagicWords.filter((word) => text.includes(word));

  if (matchedWords.length > 0) {
    return matchedWords.join(" ");
  }

  if (text.includes("огненный шар") || text.includes("fireball")) {
    return "огненный шар";
  }

  if (text.includes("заклинание света") || text.includes("spell of light")) {
    return "заклинание света";
  }

  return undefined;
}

function createResult(
  route: ChatRoute,
  options: Partial<Omit<ChatClassificationResult, "route">> = {},
): ChatClassificationResult {
  return {
    route,
    confidence: options.confidence ?? 0.7,
    detectedIntent: options.detectedIntent,
    detectedWeapon: options.detectedWeapon,
    detectedSpellFormula: options.detectedSpellFormula,
    negated: options.negated ?? false,
    historicalContext: options.historicalContext ?? false,
    trainingContext: options.trainingContext ?? false,
    tradeContext: options.tradeContext ?? false,
    matchedPhrases: options.matchedPhrases ?? [],
    warnings: options.warnings ?? [],
  };
}

export function classifyChatMessage(text: string, context: ChatClassificationContext = {}): ChatClassificationResult {
  const normalizedText = normalizeText(text);
  const historicalContext = historicalPattern.test(normalizedText);
  const trainingContext = trainingPattern.test(normalizedText);
  const tradeContext = Boolean(context.activeTrade || context.npcRole === "merchant" || tradePattern.test(normalizedText));
  const negated = negationPattern.test(normalizedText);
  const questionContext = questionPattern.test(normalizedText);
  const magicDiscussionContext = magicDiscussionPattern.test(normalizedText);
  const detectedWeapon = normalizedText.match(weaponPattern)?.[0];
  const nonNegatedText = removeNegatedCombatClauses(normalizedText);
  const onlyNegatedCombat =
    negated &&
    nonNegatedText.trim() !== normalizedText.trim() &&
    !includesAny(nonNegatedText, [
      ...meleeActionPhrases,
      ...rangedAttackPhrases,
      ...magicCastPhrases,
      ...startCombatPhrases,
      ...rangedPreparationPhrases,
      ...meleePreparationPhrases,
      ...drawWeaponPhrases,
    ]);

  if (onlyNegatedCombat) {
    return createResult("dialogue", {
      confidence: 0.92,
      negated: true,
      historicalContext,
      trainingContext,
      tradeContext,
      detectedWeapon,
      matchedPhrases: ["negation"],
      warnings: ["negatedCombatAction"],
    });
  }

  if (tradeContext && tradePattern.test(normalizedText)) {
    return createResult("trade", {
      confidence: 0.9,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      detectedWeapon,
      matchedPhrases: [normalizedText.match(tradePattern)?.[0] ?? "trade"],
    });
  }

  if (trainingContext) {
    return createResult("trainingRequest", {
      confidence: 0.86,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      detectedWeapon,
      matchedPhrases: [normalizedText.match(trainingPattern)?.[0] ?? "training"],
    });
  }

  if (inventoryPattern.test(normalizedText)) {
    return createResult("inventory", {
      confidence: 0.78,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      detectedWeapon,
      matchedPhrases: [normalizedText.match(inventoryPattern)?.[0] ?? "inventory"],
    });
  }

  if (historicalContext && !/\s(?:а|но)\s/.test(normalizedText) && !/\bbut\b/.test(normalizedText)) {
    return createResult("dialogue", {
      confidence: 0.88,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      detectedWeapon,
      matchedPhrases: [normalizedText.match(historicalPattern)?.[0] ?? "historical"],
      warnings: detectedWeapon ? ["historicalWeaponMentionWithoutCombatIntent"] : [],
    });
  }

  const parsedMagicFormula = parseMagicFormula(nonNegatedText);
  const detectedPureMagicFormula = parsedMagicFormula?.knownWordIds.join(" ");

  if (
    parsedMagicFormula &&
    detectedPureMagicFormula &&
    !tradeContext &&
    !trainingContext &&
    !historicalContext &&
    !magicDiscussionContext &&
    !negated &&
    !questionContext
  ) {
    return createResult("magic", {
      confidence: 0.91,
      detectedIntent: "castSpell",
      detectedSpellFormula: detectedPureMagicFormula,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [detectedPureMagicFormula],
    });
  }

  const magicPhrase = includesAny(nonNegatedText, magicCastPhrases);
  const detectedSpellFormula = detectSpellFormula(nonNegatedText);
  if (magicPhrase && detectedSpellFormula && !historicalContext) {
    return createResult("magic", {
      confidence: 0.93,
      detectedIntent: "castSpell",
      detectedSpellFormula,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [magicPhrase, detectedSpellFormula],
    });
  }

  const rangedAttackPhrase = includesAny(nonNegatedText, rangedAttackPhrases);
  if (rangedAttackPhrase) {
    return createResult("rangedCombat", {
      confidence: 0.95,
      detectedIntent: "rangedAttack",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [rangedAttackPhrase],
    });
  }

  const meleePhrase = includesAny(nonNegatedText, meleeActionPhrases);
  if (meleePhrase) {
    return createResult("meleeCombat", {
      confidence: 0.92,
      detectedIntent: "meleeAction",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [meleePhrase],
    });
  }

  const startCombatPhrase = includesAny(nonNegatedText, startCombatPhrases);
  if (startCombatPhrase) {
    return createResult("startCombat", {
      confidence: 0.9,
      detectedIntent: "startCombat",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [startCombatPhrase],
    });
  }

  const rangedPreparationPhrase = includesAny(nonNegatedText, rangedPreparationPhrases);
  if (rangedPreparationPhrase) {
    return createResult("rangedPreparation", {
      confidence: 0.84,
      detectedIntent: normalizedText.includes("прицел") || normalizedText.includes("aim") ? "aimWeapon" : "reloadWeapon",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [rangedPreparationPhrase],
    });
  }

  const meleePreparationPhrase = includesAny(nonNegatedText, meleePreparationPhrases);
  if (meleePreparationPhrase) {
    return createResult("meleePreparation", {
      confidence: 0.84,
      detectedIntent: "drawWeapon",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [meleePreparationPhrase],
    });
  }

  const drawWeaponPhrase = includesAny(nonNegatedText, drawWeaponPhrases);
  if (drawWeaponPhrase) {
    return createResult("worldAction", {
      confidence: 0.82,
      detectedIntent: drawWeaponPhrase.includes("убира") || drawWeaponPhrase.includes("sheathe") ? "sheatheWeapon" : "drawWeapon",
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      matchedPhrases: [drawWeaponPhrase],
    });
  }

  if (detectedWeapon) {
    return createResult("dialogue", {
      confidence: 0.74,
      detectedWeapon,
      negated,
      historicalContext,
      trainingContext,
      tradeContext,
      warnings: ["weaponMentionWithoutCombatIntent"],
    });
  }

  return createResult("dialogue", {
    confidence: 0.65,
    negated,
    historicalContext,
    trainingContext,
    tradeContext,
  });
}
