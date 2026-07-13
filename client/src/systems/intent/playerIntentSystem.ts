export type PlayerIntentType =
  | "talk"
  | "attack"
  | "defend"
  | "retreat"
  | "flee"
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
};

const INTENT_PATTERNS: Array<{
  type: PlayerIntentType;
  patterns: RegExp[];
  gameplay?: boolean;
}> = [
  {
    type: "request_city_entry",
    gameplay: true,
    patterns: [
      /хочу.{0,20}войти|пропусти|пройти.{0,20}город|впуст|пустить.{0,20}город|я прибыл|войти в город/,
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
      /оставл|оставить|не буду помогать|ухож|уйду|иду дальше|пойду своей дорогой/,
      /leave|walk away|go on|do not help|won't help/,
    ],
  },
  {
    type: "attack",
    gameplay: true,
    patterns: [
      /атак|напада|ударя|ударить|бью|рубл|режу|стреля|пытаюсь.{0,20}удар/,
      /attack|strike|hit|slash|shoot|stab|swing/,
    ],
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
      return {
        type: intent.type,
        rawText: text,
        isGameplayIntent: Boolean(intent.gameplay),
        itemHint: getItemHint(normalizedText),
      };
    }
  }

  if (context.eventId === "anariel_intro" && /кто ты|who are you|поговор|говор|скажи|tell|talk/.test(normalizedText)) {
    return { type: "talk", rawText: text, isGameplayIntent: false };
  }

  return { type: "unknown", rawText: text, isGameplayIntent: false };
}
