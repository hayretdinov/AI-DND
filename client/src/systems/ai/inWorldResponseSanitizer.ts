import type { Language } from "../../i18n/languages";

export type InWorldSpeakerRole =
  | "guard"
  | "merchant"
  | "mage"
  | "priest"
  | "scholar"
  | "companion"
  | "monster"
  | "game_master"
  | string;

export type SanitizeAiResponseInput = {
  text: string;
  speakerId?: string;
  speakerRole?: InWorldSpeakerRole;
  language: Language;
  context?: string;
};

export type SanitizeAiResponseResult = {
  cleanText: string;
  wasSanitized: boolean;
  reason?: "meta_refusal";
};

const metaRefusalPatterns = [
  /я\s+не\s+могу\s+продолжить\s+эту\s+тему/i,
  /мне\s+необходимо\s+следовать\s+правилам\s+игры/i,
  /я\s+не\s+могу\s+обсуждать\s+такие\s+темы/i,
  /задайте\s+вопрос\s+о\s+другой\s+теме/i,
  /я\s+буду\s+рад(?:а)?\s+помочь/i,
  /как\s+искусственный\s+интеллект/i,
  /мои\s+правила/i,
  /моя\s+политика/i,
  /\bas\s+an\s+ai\b/i,
  /\bi\s+cannot\s+assist\b/i,
  /\bi\s+cannot\s+continue\s+this\s+topic\b/i,
  /\bi\s+must\s+follow\s+the\s+rules\b/i,
  /\bask\s+another\s+question\b/i,
  /\bi(?:'|’)d\s+be\s+happy\s+to\s+help\b/i,
  /\b(?:my|the|our)\s+(?:policy|guidelines)\b/i,
  /\b(?:policy|guidelines)\b.*\b(?:cannot|can't|must|unable)\b/i,
  /\b(?:cannot|can't|must|unable)\b.*\b(?:policy|guidelines)\b/i,
];

const replacements = {
  ru: {
    guard: "Следи за словами. Я не стану говорить об этом.",
    merchant: "Я здесь торгую, а не обсуждаю подобные вещи.",
    mage: "Есть знания, которыми я не намерен делиться.",
    priest: "Не всякое слово следует произносить вслух.",
    edran: "Такие сведения не открывают первому встречному.",
    companion: "Мне тяжело об этом говорить. Давай пока оставим эту тему.",
    monster: "Существо отвечает глухим рычанием.",
    game_master: "На мгновение повисает тяжёлая тишина.",
    npc: "Я не стану говорить об этом.",
  },
  en: {
    guard: "Watch your words. I will not speak of this.",
    merchant: "I trade here. I do not discuss such things.",
    mage: "There is knowledge I have no intention of sharing.",
    priest: "Not every word should be spoken aloud.",
    edran: "Such knowledge is not opened to the first passerby.",
    companion: "It is hard for me to speak of this. Let us leave it for now.",
    monster: "The creature answers with a low growl.",
    game_master: "For a moment, a heavy silence hangs in the air.",
    npc: "I will not speak of this.",
  },
} as const;

function hasMetaRefusal(text: string) {
  return metaRefusalPatterns.some((pattern) => pattern.test(text));
}

function getReplacementKey(input: SanitizeAiResponseInput): keyof (typeof replacements)["ru"] {
  const speakerId = input.speakerId?.toLowerCase() ?? "";
  const role = input.speakerRole?.toLowerCase() ?? "";
  const context = input.context?.toLowerCase() ?? "";

  if (speakerId.includes("edran") || context.includes("edran") || context.includes("archive")) {
    return "edran";
  }

  if (speakerId.includes("anariel") || role === "companion") {
    return "companion";
  }

  if (role === "guard" || role === "merchant" || role === "mage" || role === "priest" || role === "monster") {
    return role;
  }

  if (role === "game_master" || role === "gm" || context.includes("game_master")) {
    return "game_master";
  }

  return "npc";
}

export function sanitizeAiResponseForWorld(input: SanitizeAiResponseInput): SanitizeAiResponseResult {
  const cleanText = input.text.trim();

  if (!cleanText || !hasMetaRefusal(cleanText)) {
    return {
      cleanText,
      wasSanitized: false,
    };
  }

  const language = input.language === "en" ? "en" : "ru";
  const replacementKey = getReplacementKey(input);

  return {
    cleanText: replacements[language][replacementKey],
    wasSanitized: true,
    reason: "meta_refusal",
  };
}
