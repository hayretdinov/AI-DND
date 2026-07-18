import type { PlayerAttackAction } from "../../types/combat";

export type PlayerIntentType =
  | "talk"
  | "attack"
  | "attack_with_equipped_weapon"
  | "unarmed_attack"
  | "kick"
  | "shove"
  | "grapple"
  | "throw_object"
  | "improvised_attack"
  | "defend"
  | "dodge"
  | "retreat"
  | "flee"
  | "use_environment"
  | "free_companion"
  | "leave_companion"
  | "request_city_entry"
  | "show_document"
  | "bribe"
  | "ask_for_item"
  | "take_item"
  | "equip_item"
  | "use_item"
  | "threaten"
  | "negotiate"
  | "persuade"
  | "intimidate"
  | "observe"
  | "search"
  | "inspect"
  | "rest"
  | "unknown";

export type SceneContext = {
  sceneId: string;
  eventId?: string;
  npcRole?: string;
  language?: "ru" | "en";
};

export type PlayerIntent = {
  type: PlayerIntentType;
  rawText: string;
  isGameplayIntent: boolean;
  itemHint?: string;
  combatAction?: PlayerAttackAction["type"];
  objectHint?: PlayerAttackAction["objectHint"];
};

const INTENT_PATTERNS: Array<{
  type: PlayerIntentType;
  patterns: RegExp[];
  gameplay?: boolean;
  combatAction?: PlayerAttackAction["type"];
  objectHint?: PlayerAttackAction["objectHint"];
}> = [
  {
    type: "request_city_entry",
    gameplay: true,
    patterns: [
      /хочу.{0,20}войти|пропусти|пройти.{0,20}город|впуст|пустить.{0,20}город|я прибыл|войти в город|пройти/,
      /want.{0,20}enter|let me in|enter.{0,20}city|pass through|arrived.{0,20}business/,
    ],
  },
  {
    type: "show_document",
    gameplay: true,
    patterns: [/показыва.{0,20}письмо|показыва.{0,20}документ|грамот|пропуск/, /show.{0,20}letter|show.{0,20}document|pass papers|writ/],
  },
  {
    type: "bribe",
    gameplay: true,
    patterns: [/взятк|подкуп|монет.{0,20}страж|заплачу/, /bribe|pay.{0,20}guard|coin.{0,20}guard/],
  },
  {
    type: "free_companion",
    gameplay: true,
    patterns: [
      /освобожд|освободить|лома(?:ю|ть).{0,20}цеп|снима(?:ю|ть).{0,20}цеп|помога(?:ю|ть).{0,40}выбраться|открыва(?:ю|ть).{0,20}замок/,
      /free|release|break.{0,20}chain|unlock|help.{0,30}escape/,
    ],
  },
  {
    type: "leave_companion",
    gameplay: true,
    patterns: [
      /оставл|оставить|не буду помогать|ухожу|уйду|иду дальше|пойду своей дорогой/,
      /leave|walk away|go on|do not help|won't help/,
    ],
  },
  {
    type: "throw_object",
    gameplay: true,
    combatAction: "throw_object",
    objectHint: "stone",
    patterns: [
      /броса(?:ю|ть).{0,20}(?:камень|камнем|бутыл|факел|палк|предмет)|кида(?:ю|ть).{0,20}(?:камень|камнем|бутыл|факел|палк|предмет)|швыря(?:ю|ть).{0,20}(?:камень|камнем|бутыл|факел|палк|предмет)/,
      /throw.{0,20}(?:stone|rock|bottle|torch|stick|object)|hurl.{0,20}(?:stone|rock|bottle|torch|stick|object)/,
    ],
  },
  {
    type: "improvised_attack",
    gameplay: true,
    combatAction: "improvised",
    patterns: [
      /использу(?:ю|ю).{0,20}(?:палк|бутыл|факел|предмет)|бью.{0,20}(?:палк|бутыл|факел|предмет)/,
      /improvis|use.{0,20}(?:stick|bottle|torch|object)|hit.{0,20}(?:stick|bottle|torch|object)/,
    ],
  },
  {
    type: "kick",
    gameplay: true,
    combatAction: "kick",
    patterns: [/пина(?:ю|ть)|бью.{0,12}ног|сбить.{0,20}с ног|удар.{0,12}ног/, /kick|boot|trip/],
  },
  {
    type: "shove",
    gameplay: true,
    combatAction: "shove",
    patterns: [/толка(?:ю|ть)|оттолк|сбива(?:ю|ть).{0,20}с ног|пихаю/, /shove|push|knock.{0,20}down/],
  },
  {
    type: "grapple",
    gameplay: true,
    combatAction: "grapple",
    patterns: [/хвата(?:ю|ть)|удерж|обхват|борюсь|схват/, /grapple|grab|hold|wrestle/],
  },
  {
    type: "unarmed_attack",
    gameplay: true,
    combatAction: "unarmed",
    patterns: [
      /кулак|кулаком|кулаками|бью.{0,20}(?:рук|лиц|его|ее|её)|ударя(?:ю|ть)|дерусь|без оруж/,
      /punch|fist|unarmed|bare hand|hit.{0,20}(?:face|him|her)/,
    ],
  },
  {
    type: "attack_with_equipped_weapon",
    gameplay: true,
    combatAction: "weapon",
    patterns: [
      /(?:атак|напада|бью|ударя|рубл|режу|колю|замахива|выпад).{0,36}(?:меч|топор|кинжал|нож|лук|арбалет|стрел|болт|дубин|булав|копь)|(?:мечом|топором|кинжалом|ножом|дубиной|булавой|копьем).{0,36}(?:атак|бью|ударя|рубл|режу|колю)|(?:стреляю|выстрел|выпускаю).{0,36}(?:лук|арбалет|стрел|болт)/,
      /(?:attack|strike|hit|slash|stab|swing|shoot|fire|loose).{0,36}(?:sword|axe|dagger|knife|bow|crossbow|arrow|bolt|club|mace|spear)|(?:with|using).{0,16}(?:sword|axe|dagger|knife|bow|crossbow|club|mace|spear).{0,36}(?:attack|strike|hit|slash|stab|shoot|fire)/,
    ],
  },
  {
    type: "attack",
    gameplay: true,
    combatAction: "auto",
    patterns: [/атак|напада|ударить|ударю|бью|strike|attack|hit|swing/, /attack|strike|hit|swing/],
  },
  {
    type: "dodge",
    gameplay: true,
    patterns: [/уворач|отскак|уйти.{0,20}удар/, /dodge|sidestep|evade/],
  },
  {
    type: "defend",
    gameplay: true,
    patterns: [/защища|закрыва|блокир|ставлю блок/, /defend|block|guard myself/],
  },
  {
    type: "flee",
    gameplay: true,
    patterns: [/убег|пытаюсь.{0,20}убежать|бежать/, /flee|run away|escape/],
  },
  {
    type: "retreat",
    gameplay: true,
    patterns: [/отступ|ухожу назад|медленно отхожу|продолжаю путь/, /retreat|step back|back away|continue/],
  },
  {
    type: "ask_for_item",
    gameplay: true,
    patterns: [
      /дай|дайте|прошу|нужн|можешь дать|есть ли у тебя|хочу добыть/,
      /give me|need|ask for|do you have|can you give|want to get/,
    ],
  },
  {
    type: "equip_item",
    gameplay: true,
    patterns: [/надева|одева|экипир|беру.{0,20}в руку/, /equip|wear|put on|take.{0,20}in hand/],
  },
  {
    type: "use_item",
    gameplay: true,
    patterns: [/использ|ем |съед|открыва|читаю/, /use|eat|open|read/],
  },
  {
    type: "threaten",
    gameplay: true,
    patterns: [/угрож|запуг|убью|пригрож/, /threat|intimidat|scare|kill you/],
  },
  {
    type: "negotiate",
    gameplay: true,
    patterns: [/договор|убежда|мирно|без крови|переговор/, /negotiate|persuade|peace|no blood|talk this out/],
  },
  {
    type: "observe",
    gameplay: true,
    patterns: [/осматри|смотрю|наблюда/, /observe|look around|watch/],
  },
  {
    type: "search",
    gameplay: true,
    patterns: [/ищу|обыскива|поиск/, /search|look for/],
  },
  {
    type: "inspect",
    gameplay: true,
    patterns: [/изуча|проверя|осмотреть|трогаю/, /inspect|examine|check/],
  },
  {
    type: "rest",
    gameplay: true,
    patterns: [/отдыха|сплю|привал/, /rest|sleep|camp/],
  },
];

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

function getItemHint(text: string) {
  if (/одежд|clothes|cloth/.test(text)) {
    return "simple_clothes";
  }

  if (/меч|sword/.test(text)) {
    return "rusty_sword";
  }

  if (/дубин|club/.test(text)) {
    return "wooden_club";
  }

  if (/хлеб|ед|food|bread/.test(text)) {
    return "stale_bread";
  }

  if (/ключ|key/.test(text)) {
    return "rusty_key";
  }

  if (/отмыч|lockpick/.test(text)) {
    return "lockpick";
  }

  return undefined;
}

export function parsePlayerIntent(text: string, context: SceneContext): PlayerIntent {
  const normalizedText = normalize(text);

  for (const intent of INTENT_PATTERNS) {
    if (intent.patterns.some((pattern) => pattern.test(normalizedText))) {
      const parsedIntent: PlayerIntent = {
        type: intent.type,
        rawText: text,
        isGameplayIntent: Boolean(intent.gameplay),
        itemHint: getItemHint(normalizedText),
        combatAction: intent.combatAction,
        objectHint: intent.objectHint,
      };

      console.info("[Intent] parsed", {
        rawText: text,
        intentType: parsedIntent.type,
        combatAction: parsedIntent.combatAction,
      });

      return parsedIntent;
    }
  }

  if (context.eventId === "anariel_intro" && /кто ты|who are you|поговор|говор|скажи|tell|talk/.test(normalizedText)) {
    const parsedIntent: PlayerIntent = { type: "talk", rawText: text, isGameplayIntent: false };
    console.info("[Intent] parsed", { rawText: text, intentType: parsedIntent.type });
    return parsedIntent;
  }

  const parsedIntent: PlayerIntent = { type: "unknown", rawText: text, isGameplayIntent: false };
  console.info("[Intent] parsed", { rawText: text, intentType: parsedIntent.type });
  return parsedIntent;
}
