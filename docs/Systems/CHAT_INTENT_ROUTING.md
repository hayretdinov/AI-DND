# Chat Intent Routing

The NPC chat input is classified before combat, magic, trading, or training systems receive the text. This keeps weapon names from starting combat by themselves.

## Routes

- `trainingRequest`: current route for lessons, practice, or "show me how" requests. `EventScene` uses it to ask trainer/blacksmith NPCs for access before any training UI actions appear.
- `training`: legacy route name kept in the TypeScript union for compatibility.
- `dialogue`: ordinary speech, lore, memories, questions, or weapon mentions without an action.
- `trade`: buying, selling, price discussion, or active merchant negotiation.
- `training`: lessons, practice, or “show me how” requests.
- `magic`: an explicit spell cast with a recognizable formula or spell phrase.
- `rangedPreparation`: aiming, reloading, drawing a bow, or preparing a shot without releasing it.
- `rangedCombat`: an explicit shot or released arrow/bolt.
- `meleePreparation`: drawing a melee weapon, raising a shield, or preparing close combat without a strike.
- `meleeCombat`: an explicit attack, strike, cut, stab, shove, or similar melee action.
- `startCombat`: a declaration of beginning combat without a resolved attack roll.
- `worldAction`: drawing or putting away a weapon without attacking.
- `inventory`: inventory and equipment commands.

## Safety Rules

Weapon words such as “меч”, “лук”, “стрелы”, “арбалет”, “sword”, or “bow” are metadata, not combat intent. Combat is routed only when an action phrase is present.

Negated clauses are stripped before routing, so “не атакую торговца” remains dialogue, while “не атакую первого разбойника, а стреляю во второго” routes to ranged combat.

Historical and teaching contexts have priority over combat. “Я рассказываю, как вчера атаковал разбойника” stays dialogue, and “покажи, как ударить мечом” goes to training.

Merchant context has priority for trade wording. “Покупаю арбалет и спрашиваю, как им стрелять” remains trade first, so the purchase flow is not confused with a shot.

## Magic Formula Routing

Pure magic formulas are routed as `magic` after the safety gates above. `Игнис Ланца Хостис`, lowercase input, quoted input, comma-separated input, and `Произношу: Игнис Ланца Хостис.` all reach the magic resolver.

Explicit magic casting phrases are also checked before ranged and melee combat routing, so a cast command with known magic words cannot be stolen by a weapon-action phrase.

Questions (`Что означает Игнис?`), training/history mentions (`Аркел рассказывал мне про Игнис Ланца.`), negation (`Я не произношу Игнис.`), and trade (`Можно купить свиток Игнис?`) remain non-cast routes.

## Regression Coverage

`client/src/systems/intent/chatIntentRouter.test.ts` contains deterministic cases for weapon mentions, negation, trade, training, ranged preparation, melee preparation, ranged combat, melee combat, and magic casting.

`client/src/systems/intent/chatIntentRouter.integration.test.ts` mirrors the real scene routing boundary: trade/training/preparation routes must not call combat resolvers, while melee/ranged/magic routes map to their dedicated deterministic systems. The project currently has no dedicated test runner script; `npm run build` still type-checks these fixtures.

The melee regression set now includes unarmed, kick, shove, grapple, spear, hammer, and shield phrases. See `docs/Systems/MELEE_COMBAT.md`.
