# Magic Word Combat

Update date: 2026-07-17

Magic combat uses the existing Magic Word System and the shared turn-based combat flow. There is no second spell engine.

## Runtime Flow

```text
Scene chat input
-> classifyChatMessage
-> parseMagicFormula
-> validateMagicFormula
-> resolveSpell
-> syncCombatStateAfterPlayerAction
-> resolveEnemyTurn
-> Game Master narration
-> saveGame
```

`EventScene` only calls the magic resolver when `chatIntentRouter` returns `magic`.

The chat router checks explicit magic casting before ranged or melee combat routing after safety gates, so `Игнис Ланца Хостис` and `Произношу: Игнис Ланца Хостис.` remain on the magic path even after melee phrase expansion.

## Pure Formula Casting

The router accepts a bare known formula as a cast action. These forms are equivalent:

- `Игнис Ланца Хостис`
- `игнис ланца хостис`
- `«Игнис Ланца Хостис»`
- `Игнис, Ланца, Хостис!`
- `Произношу: Игнис Ланца Хостис.`

The parser stores canonical ids, not display text:

```text
Игнис -> ignis
Ланца -> lancea
Хостис -> hostis
```

## Safety Gates

Magic formula routing is blocked by higher-priority contexts:

- questions and explanations, for example `Что означает Игнис?`;
- historical or teaching mentions, for example `Аркел рассказывал мне про Игнис Ланца.`;
- negation, for example `Я не произношу Игнис.`;
- trade wording, for example `Можно купить свиток Игнис?`.

Unknown words inside the formula still block validation. The parser may ignore casting-intro text before the first magic word, but it does not silently invent unknown canonical ids.

## Fire Lance

`Игнис Ланца Хостис` resolves as spell `fire_lance`:

```text
requiredWordIds: ignis + lancea + hostis
target: enemy
type: directed fire projectile
mana: spent by validate/resolve flow
damage: applied by resolveSpell when the spell hits
```

After a valid hit or failed cast, the normal combat turn queue continues. If the enemy is alive, `resolveEnemyTurn` can act next.

## Trainer Link

Magister Arkel's basic magic lesson now teaches the beginner combat minimum:

- words: `ignis`, `manus`, `minora`, `lancea`, `hostis`, `sphere`;
- formula: `fire_lance`;
- magic access: enabled with starter mana for characters who unlocked magic through training.

## Verification

Regression coverage is in:

- `client/src/systems/magic/magicParser.test.ts`
- `client/src/systems/magic/magicValidator.test.ts`
- `client/src/systems/magic/spellResolver.test.ts`
- `client/src/systems/intent/chatIntentRouter.test.ts`
- `client/src/systems/intent/chatIntentRouter.integration.test.ts`

The project has no dedicated `test` script. `npm.cmd run build` runs `tsc --noEmit` and compiles the fixtures.
