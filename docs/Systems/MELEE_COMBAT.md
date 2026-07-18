# Text Melee Combat

Update date: 2026-07-17

Text melee combat uses the existing chat routing, combat validator, dice system, active turn state, and Game Master narration boundary. It does not create a second combat engine.

## Runtime Flow

```text
EventScene chat input
-> classifyChatMessage
-> parseTextCombatAction
-> normalizeTextCombatAction
-> validateTextCombatAction
-> resolveTextCombatAction
-> syncCombatStateAfterPlayerAction
-> resolveEnemyTurn
-> Game Master narration
-> saveGame
```

## Weapon Categories

`meleeWeaponConfig.ts` is the single category table for text melee:

- `unarmed`
- `sword`
- `dagger`
- `knife`
- `club`
- `mace`
- `axe`
- `spear`
- `staff`
- `hammer`
- `shield`
- `improvised`

Each category declares damage dice, damage type, attack attribute, stamina cost, allowed distances, base attack types, techniques, and whether it requires an equipped inventory item.

Inventory items are still authoritative for equipped weapons. The text category layer only maps player phrases like "spear", "hammer", "shield", or "fist" onto the existing equipped item model so old saves continue to work.

## Unarmed Actions

Punches, kicks, shove, and grapple are valid without an equipped weapon. They use virtual unarmed validation and spend stamina through the same text combat state.

Shove and grapple resolve a real attack contest but do not apply normal weapon damage. A successful grapple adds a short `grappled` combat injury/status to the NPC text combat state.

## Distance And Stamina

Distance penalties are category-specific:

- daggers, knives, and unarmed attacks work best very close;
- spears, staves, and large swords prefer melee or reach;
- shields, clubs, maces, hammers, and axes are close melee tools.

Stamina cost comes from the category table and is adjusted by attack power, tempo, movement, technique, and kick cost.

## Routing Safety

`chatIntentRouter` checks magic casting before ranged or melee combat after high-priority safety gates. This preserves the magic formula route for `Игнис Ланца Хостис` while still routing explicit melee phrases such as:

- `Бью разбойника мечом`
- `Бью разбойника кулаком`
- `Пинаю разбойника`
- `Толкаю разбойника щитом`
- `Хватаю разбойника`
- `Колю копьем`
- `Бью молотом`

Weapon mentions without action words remain dialogue.

## Verification

Compile-time fixtures are stored in:

- `client/src/systems/combat/text/combatTextSystem.test.ts`
- `client/src/systems/intent/chatIntentRouter.test.ts`
- `client/src/systems/intent/chatIntentRouter.integration.test.ts`

The project has no dedicated test script. `npm.cmd run build` runs `tsc --noEmit` and verifies the fixtures compile with the runtime types.
