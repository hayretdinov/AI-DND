# Turn Based Combat

Update date: 2026-07-17

## CombatState

The authoritative active combat state is stored on `GameSave.activeCombat`.

It contains:

- `phase`: `awaitingPlayerAction`, `resolvingPlayerAction`, `resolvingEnemyTurns`, `victory`, `defeat`, or `finished`.
- `round`: the current combat round.
- `turnOrder`: stable combatant ids sorted by initiative.
- `currentTurnIndex` and `activeCombatantId`: the current actor.
- `combatants`: player, allies, enemies, NPCs, and monsters in one common shape.
- `appliedActionIds`: a short deduplication list that prevents repeated application of the same action.
- `log`: structured internal results with debug data.

HP is still synchronized with the existing player and NPC combat fields so old UI and saves continue to work, but turn order and phase now live in `activeCombat`.

## Initiative

At combat start each combatant rolls internal initiative using:

```text
d20 + Dexterity modifier
```

Ties are stable:

1. higher Dexterity modifier;
2. stable combatant id.

The sorted order is saved and does not change on rerender.

## Player Action

NPC scene chat routes combat text through the existing parsers and resolvers:

- text melee: `resolveTextCombatAction`;
- ranged combat: `resolveRangedCombatAction`;
- magic: `resolveSpell`;
- legacy fallback: `resolvePlayerAttack`.

Text melee weapon resolution is category-aware through `meleeWeaponConfig.ts`. Equipped inventory items remain authoritative, while text categories cover sword, dagger, knife, club, mace, axe, spear, staff, hammer, shield, improvised, and unarmed actions.

The AI and Game Master do not decide hits, damage, death, mana, stamina, or ammunition. They only receive resolved outcomes for narration.

Invalid or unrecognized actions do not advance the queue and do not grant the enemy a free turn.

Magic actions can be entered as pure formulas after chat routing safety checks. `Игнис Ланца Хостис` resolves through `resolveSpell`, mutates NPC HP on hit, spends mana, and then uses the same `syncCombatStateAfterPlayerAction` / `resolveEnemyTurn` flow as melee and ranged attacks.

Valid shove and grapple actions advance the same turn flow. They do not apply normal weapon damage, but a successful grapple records a short text-combat status on the NPC.

## Enemy Turn

After a valid player combat action, `EventScene` synchronizes `activeCombat` through `syncCombatStateAfterPlayerAction`.

If the enemy is alive and can act, `resolveEnemyTurn` runs automatically:

1. reads the same NPC combat stats used by existing combat;
2. rolls internally against player armor;
3. applies player HP with `Math.max(0, currentHp - damage)`;
4. records a structured debug log entry;
5. returns control to `awaitingPlayerAction` or ends combat with `defeat`.

Dead enemies do not receive a turn.

## Death And End

When all enemies are unable to continue, phase becomes `victory`.

When the player reaches 0 HP, phase becomes `defeat`, enemy processing stops, and the active combat is marked with `finishedAt`.

## Multiple Combatants

The `CombatState` shape supports several enemies and allies in the same queue. The current scene path still resolves the active NPC encounter, but the saved queue and combatant map are ready for additional participants without introducing another combat engine.

## Narration

Player-facing chat receives only sanitized Game Master text. Rolls, armor class, bonuses, formulas, numeric damage, and HP fractions remain inside resolver results, debug data, and the combat log.

## Save Safety

`saveSystem` normalizes `activeCombat` for old and current saves. Invalid or empty combat state is discarded. Saved action ids prevent double application across rerenders or callback repetition.

`combatInputPolicy` mirrors turn phases in the shared textarea: enabled on `awaitingPlayerAction`, disabled during resolution/enemy turns, and restored after the enemy resolver. This policy applies equally to NPCs, beasts, monsters, and undead.
