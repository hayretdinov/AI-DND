import { magicConfig } from "./magicConfig";
import { getMagicWordByToken, normalizeMagicWordToken } from "./magicWords";
import type { ParsedMagicFormula, ParsedMagicWord } from "./magicTypes";

const QUOTED_FORMULA_PATTERN = /[«"“](.*?)[»"”]/u;
const CASTING_HINT_PATTERN = /произнош|произношу|говорю|шепчу|заклин|формул|cast|spell|say|whisper/i;

function getCandidateText(text: string) {
  const quoted = text.match(QUOTED_FORMULA_PATTERN)?.[1];

  if (quoted) {
    return quoted;
  }

  const colonIndex = text.indexOf(":");

  if (colonIndex >= 0 && CASTING_HINT_PATTERN.test(text.slice(0, colonIndex))) {
    return text.slice(colonIndex + 1);
  }

  return text;
}

function tokenize(text: string) {
  return text
    .split(/[\s,.;:!?()[\]{}]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function parseMagicFormula(text: string): ParsedMagicFormula | null {
  const candidateText = getCandidateText(text);
  const tokens = tokenize(candidateText).slice(0, magicConfig.maxWordsPerFormula + 8);
  const parsedTokens: ParsedMagicWord[] = tokens.map((token) => {
    const word = getMagicWordByToken(token);

    return {
      rawToken: token,
      normalizedToken: normalizeMagicWordToken(token),
      word,
      unknown: !word,
    };
  });
  const recognizedWords = parsedTokens.filter((word) => word.word);
  const hasCastingIntent = QUOTED_FORMULA_PATTERN.test(text) || CASTING_HINT_PATTERN.test(text);
  const firstRecognizedIndex = parsedTokens.findIndex((word) => word.word);

  if (recognizedWords.length === 0 || (!hasCastingIntent && recognizedWords.length < 2)) {
    return null;
  }

  const formulaWords = parsedTokens
    .slice(Math.max(0, firstRecognizedIndex))
    .slice(0, magicConfig.maxWordsPerFormula);

  return {
    rawText: text,
    formulaText: candidateText,
    words: formulaWords,
    knownWordIds: formulaWords.flatMap((word) => (word.word ? [word.word.id] : [])),
    unknownTokens: formulaWords.filter((word) => word.unknown).map((word) => word.rawToken),
  };
}
