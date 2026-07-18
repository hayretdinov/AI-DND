# Combat Thought Hints

Update date: 2026-07-18

## Purpose

Combat thought hints reuse the existing event "Thoughts" panel to show short, contextual examples of what the player can type during combat.

The system is deterministic and does not call Local AI or any external model. Hints are helper text only: clicking an example inserts it into the existing NPC dialogue input and does not send or execute the action.

## Files

- `client/src/systems/combat/combatThoughtHints.ts` contains the generator and public context/hint types.
- `client/src/screens/EventScene.tsx` builds the context from the current save, active combat state, NPC state, equipment, magic knowledge, ranged weapon state, and text-combat distance.
- `client/src/i18n/translations/ru.ts` and `client/src/i18n/translations/en.ts` contain all visible hint strings and examples.
- `client/src/styles/global.css` styles the inline example text inside the existing thought panel.
- `client/src/systems/combat/combatThoughtHints.test.ts` provides compile-time regression fixtures for the generator.

## Context Inputs

The generator receives:

- combat phase and active combatant id;
- player and target combatant state;
- equipped weapon and offhand item;
- known magic words and known spell formula ids;
- text-combat distance and cover;
- post-combat state;
- ranged weapon loaded state and ammo availability.

When `activeCombat` is missing in older saves, `EventScene` builds a fallback combatant context from `player.combat`, `player.magic`, `player.textCombat`, and `npc.combat`.

## Hint Rules

- Sword, dagger, club, mace, axe, spear, ranged weapons, and unarmed states get different attack examples.
- Melee hints do not suggest impossible attacks at medium distance; they suggest closing distance first.
- Spear hints suggest stepping back if the enemy is too close.
- Shield hints appear only when a shield/offhand shield is equipped.
- Dodge and parry hints depend on stamina and equipment.
- Fire lance appears only when the player knows `ignis`, `lancea`, and `hostis` or knows the `fire_lance` formula, has enough mana, and has a target.
- Crossbows suggest reload while unloaded and shooting only when ready.
- Ranged weapons without ammo show a resource warning instead of a shot.
- Enemy turn shows only a wait hint.
- Post-combat hints switch to surrender/demand/search wording.

## Insertion Behavior

The "Thoughts" panel is not a command menu. Each example is rendered as inline text. Selecting it calls the local insertion handler in `EventScene`, which sets the dialogue input value. The normal send button and existing chat routing still decide whether the text becomes melee, ranged, magic, training, trade, dialogue, or a world action.

## Verification

- `npm.cmd run build` in `client` passed on 2026-07-18.
- The client has no separate `test` script; the `.test.ts` fixtures compile as part of the TypeScript build.

The same hint insertion target remains available for non-sapient combat. `usesNpcDialogue = false` does not remove the shared textarea, so selecting a hint can still populate the next player action.
