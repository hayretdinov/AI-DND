import { parseMagicFormula } from "./magicParser";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runMagicParserSelfTest() {
  const quoted = parseMagicFormula("Я произношу: «Игнис Манус Минора».");
  const latin = parseMagicFormula("cast ignis manus minora");
  const plain = parseMagicFormula("Я просто спрашиваю дорогу.");
  const unknown = parseMagicFormula("Я говорю: «Игнис Фальшивум Минора».");
  const pureCombatFormula = parseMagicFormula("Игнис Ланца Хостис");
  const lowercaseCombatFormula = parseMagicFormula("игнис ланца хостис");
  const quotedCombatFormula = parseMagicFormula("«Игнис Ланца Хостис»");
  const punctuatedCombatFormula = parseMagicFormula("Игнис, Ланца, Хостис!");
  const introducedCombatFormula = parseMagicFormula("Произношу: Игнис Ланца Хостис.");

  assert(quoted?.knownWordIds.join(",") === "ignis,manus,minora", "Parser must read Cyrillic quoted formulas.");
  assert(latin?.knownWordIds.join(",") === "ignis,manus,minora", "Parser must read Latin formulas.");
  assert(plain === null, "Parser must ignore normal dialogue.");
  assert(unknown?.unknownTokens.includes("Фальшивум") ?? false, "Parser must preserve unknown words.");
  assert(pureCombatFormula?.knownWordIds.join(",") === "ignis,lancea,hostis", "Parser must read pure combat formulas.");
  assert(lowercaseCombatFormula?.knownWordIds.join(",") === "ignis,lancea,hostis", "Parser must normalize lowercase combat formulas.");
  assert(quotedCombatFormula?.knownWordIds.join(",") === "ignis,lancea,hostis", "Parser must read quoted combat formulas.");
  assert(punctuatedCombatFormula?.knownWordIds.join(",") === "ignis,lancea,hostis", "Parser must ignore punctuation between magic words.");
  assert(introducedCombatFormula?.knownWordIds.join(",") === "ignis,lancea,hostis", "Parser must ignore casting-intro text before a colon.");
}
