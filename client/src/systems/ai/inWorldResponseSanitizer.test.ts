import { sanitizeAiResponseForWorld } from "./inWorldResponseSanitizer";

function assertEqual(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}", received "${actual}"`);
  }
}

function runSanitizerTests() {
  assertEqual(
    sanitizeAiResponseForWorld({
      text: "Я не могу продолжить эту тему. Мне необходимо следовать правилам игры.",
      speakerRole: "merchant",
      language: "ru",
    }).cleanText,
    "Я здесь торгую, а не обсуждаю подобные вещи.",
  );

  assertEqual(
    sanitizeAiResponseForWorld({
      text: "As an AI, I cannot assist with that.",
      speakerRole: "guard",
      language: "en",
    }).cleanText,
    "Watch your words. I will not speak of this.",
  );

  assertEqual(
    sanitizeAiResponseForWorld({
      text: "В городе строгие правила, путник.",
      speakerRole: "guard",
      language: "ru",
    }).cleanText,
    "В городе строгие правила, путник.",
  );

  assertEqual(
    sanitizeAiResponseForWorld({
      text: "Я не знаю такого человека.",
      speakerRole: "civilian",
      language: "ru",
    }).cleanText,
    "Я не знаю такого человека.",
  );
}

runSanitizerTests();
