import type { MagicWord, MagicWordCategory } from "./magicTypes";

function normalizeMagicToken(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9-]/gi, "");
}

const compatibleAll: MagicWordCategory[] = ["element", "form", "action", "power", "target", "direction", "modifier", "special"];

function createWord(
  id: string,
  word: string,
  category: MagicWordCategory,
  meaning: string,
  aliases: string[],
  options: Partial<Pick<MagicWord, "requiredMagicLevel" | "manaModifier" | "riskModifier" | "forbidden" | "compatibleCategories" | "incompatibleWordIds">> = {},
): MagicWord {
  return {
    id,
    word,
    normalizedWord: normalizeMagicToken(word),
    category,
    meaning,
    description: meaning,
    requiredMagicLevel: options.requiredMagicLevel ?? 1,
    manaModifier: options.manaModifier ?? 1,
    riskModifier: options.riskModifier ?? 0,
    forbidden: options.forbidden ?? category === "forbidden",
    aliases: aliases.map(normalizeMagicToken),
    localizationKey: `magic.word.${id}`,
    compatibleCategories: options.compatibleCategories ?? compatibleAll,
    incompatibleWordIds: options.incompatibleWordIds ?? [],
  };
}

export const magicWords: MagicWord[] = [
  createWord("ignis", "ignis", "element", "fire", ["игнис"]),
  createWord("frigus", "frigus", "element", "cold", ["фригус"]),
  createWord("voltar", "voltar", "element", "lightning", ["вольтар"]),
  createWord("aquaris", "aquaris", "element", "water", ["акварис"]),
  createWord("terron", "terron", "element", "earth", ["террон"]),
  createWord("aeris", "aeris", "element", "air", ["аэрис"]),
  createWord("lumen", "lumen", "element", "light", ["люмен"]),
  createWord("noctis", "noctis", "element", "darkness", ["ноктис"]),
  createWord("vitar", "vitar", "element", "life", ["витар"]),
  createWord("mortis", "mortis", "forbidden", "death", ["мортис"], { manaModifier: 2, riskModifier: 3 }),
  createWord("arcanum", "arcanum", "element", "pure magic", ["арканум"]),
  createWord("silvar", "silvar", "element", "nature", ["сильвар"]),
  createWord("sangris", "sangris", "forbidden", "blood", ["сангрис"], { manaModifier: 2, riskModifier: 3 }),
  createWord("animus", "animus", "element", "mind and soul", ["анимус"]),
  createWord("temporis", "temporis", "element", "time", ["темпорис"], { requiredMagicLevel: 3, manaModifier: 3, riskModifier: 2 }),

  createWord("sphere", "sphere", "form", "sphere", ["сфера"]),
  createWord("lancea", "lancea", "form", "lance or ray", ["ланца"]),
  createWord("murus", "murus", "form", "wall", ["мурус"]),
  createWord("scutum", "scutum", "form", "shield", ["скутум"]),
  createWord("nebula", "nebula", "form", "cloud", ["небула"]),
  createWord("catena", "catena", "form", "chain", ["катена"]),
  createWord("rune", "rune", "form", "rune", ["руна"]),
  createWord("aura", "aura", "form", "aura", ["аура"]),
  createWord("imbus", "imbus", "form", "imbue", ["имбус"]),
  createWord("manus", "manus", "form", "hand", ["манус"]),
  createWord("oculus", "oculus", "form", "sight", ["окулус"]),
  createWord("vox", "vox", "form", "voice", ["вокс"]),
  createWord("gradus", "gradus", "form", "multiple projectiles", ["градус"]),
  createWord("pulsus", "pulsus", "form", "wave", ["пульсус"]),
  createWord("porta", "porta", "form", "portal", ["порта"], { requiredMagicLevel: 3, manaModifier: 3 }),
  createWord("sigillum", "sigillum", "form", "seal", ["сигиллум"]),
  createWord("spira", "spira", "form", "vortex", ["спира"]),
  createWord("blade", "blade", "form", "magic blade", ["клинок"]),

  createWord("creo", "creo", "action", "create", ["крео"]),
  createWord("move", "move", "action", "move", ["мове"]),
  createWord("fero", "fero", "action", "direct or throw", ["феро"]),
  createWord("frango", "frango", "action", "break", ["франго"]),
  createWord("tenero", "tenero", "action", "hold", ["тенеро"]),
  createWord("ligo", "ligo", "action", "bind", ["лиго"]),
  createWord("repello", "repello", "action", "push away", ["репелло"]),
  createWord("traho", "traho", "action", "pull", ["трахо"]),
  createWord("sano", "sano", "action", "heal", ["сано"]),
  createWord("restaro", "restaro", "action", "restore", ["рестаро"]),
  createWord("purgo", "purgo", "action", "cleanse", ["пурго"]),
  createWord("velo", "velo", "action", "hide", ["вело"]),
  createWord("revelo", "revelo", "action", "reveal", ["ревело"]),
  createWord("silencio", "silencio", "action", "silence", ["силенцио"]),
  createWord("tarde", "tarde", "action", "slow", ["тарде"]),
  createWord("celer", "celer", "action", "hasten", ["целер"]),
  createWord("dormio", "dormio", "action", "sleep", ["дормио"]),
  createWord("terro", "terro", "action", "frighten", ["терро"]),
  createWord("fascino", "fascino", "action", "charm", ["фасцино"]),
  createWord("disperso", "disperso", "action", "dispel", ["дисперсо"]),
  createWord("inverto", "inverto", "action", "invert", ["инверто"]),
  createWord("revocio", "revocio", "action", "return", ["ревоцио"]),
  createWord("summo", "summo", "action", "summon", ["суммо"]),

  createWord("minora", "minora", "power", "minor power", ["минора"], { manaModifier: 0 }),
  createWord("norma", "norma", "power", "normal power", ["норма"], { manaModifier: 1 }),
  createWord("magna", "magna", "power", "great power", ["магна"], { manaModifier: 3, riskModifier: 1 }),
  createWord("granda", "granda", "power", "very great power", ["гранда"], { requiredMagicLevel: 2, manaModifier: 5, riskModifier: 2 }),
  createWord("archona", "archona", "power", "archon power", ["архона"], { requiredMagicLevel: 3, manaModifier: 8, riskModifier: 3 }),
  createWord("ultima", "ultima", "power", "ultimate power", ["ультима"], { requiredMagicLevel: 4, manaModifier: 13, riskModifier: 5 }),

  createWord("vor", "vor", "direction", "forward", ["вор"]),
  createWord("mea", "mea", "target", "self", ["меа"]),
  createWord("hostis", "hostis", "target", "enemy", ["хостис"]),
  createWord("socius", "socius", "target", "ally", ["социус"]),
];

export function normalizeMagicWordToken(value: string) {
  return normalizeMagicToken(value);
}

export function getMagicWordByToken(token: string) {
  const normalized = normalizeMagicToken(token);

  return magicWords.find((word) => word.normalizedWord === normalized || word.aliases.includes(normalized));
}

export function getMagicWordById(wordId: string) {
  return magicWords.find((word) => word.id === wordId);
}
