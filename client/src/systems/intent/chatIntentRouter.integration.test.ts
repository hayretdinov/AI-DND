import { classifyChatMessage, type ChatRoute } from "./chatIntentRouter";

type ResolverName = "none" | "melee" | "ranged" | "magic" | "preparation" | "trade" | "training";

function resolvePipelineRoute(route: ChatRoute): ResolverName {
  if (route === "meleeCombat") {
    return "melee";
  }

  if (route === "rangedCombat") {
    return "ranged";
  }

  if (route === "magic") {
    return "magic";
  }

  if (route === "rangedPreparation" || route === "meleePreparation" || route === "worldAction" || route === "startCombat") {
    return "preparation";
  }

  if (route === "trade") {
    return "trade";
  }

  if (route === "training") {
    return "training";
  }

  return "none";
}

const cases: Array<{ text: string; expected: ResolverName; npcRole?: string; activeTrade?: boolean }> = [
  { text: "Хочу купить меч", expected: "trade", npcRole: "merchant" },
  { text: "Покажи кинжал", expected: "none" },
  { text: "Расскажи, как стрелять из лука", expected: "training", npcRole: "trainer" },
  { text: "Я не атакую торговца", expected: "none", npcRole: "merchant" },
  { text: "Бью торговца мечом", expected: "melee", npcRole: "merchant" },
  { text: "Бью разбойника кулаком", expected: "melee" },
  { text: "Толкаю разбойника щитом", expected: "melee" },
  { text: "Колю разбойника копьём", expected: "melee" },
  { text: "Стреляю в разбойника", expected: "ranged" },
  { text: "Колю кинжалом", expected: "melee" },
  { text: "Произношу Игнис Ланца Хостис", expected: "magic" },
  { text: "Игнис Ланца Хостис", expected: "magic" },
  { text: "Что означает Игнис?", expected: "none" },
  { text: "Можно купить свиток Игнис?", expected: "trade", npcRole: "merchant" },
  { text: "Заряжаю арбалет", expected: "preparation" },
  { text: "Навожу лук на разбойника", expected: "preparation" },
];

for (const testCase of cases) {
  const result = classifyChatMessage(testCase.text, {
    npcRole: testCase.npcRole,
    activeTrade: testCase.activeTrade,
  });
  const resolver = resolvePipelineRoute(result.route);

  if (resolver !== testCase.expected) {
    throw new Error(`Expected "${testCase.text}" to route to ${testCase.expected}, got ${resolver} via ${result.route}`);
  }
}
