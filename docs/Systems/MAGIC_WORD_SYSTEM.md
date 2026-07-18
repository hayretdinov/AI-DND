# Magic Word System

Update date: 2026-07-17

The magic system is a local, deterministic text-driven engine. The player casts by typing words in normal chat. There are no spell buttons and Local AI does not decide outcomes.

## Runtime Flow

```text
Player chat text
-> parseMagicFormula
-> validateMagicFormula
-> resolveSpell
-> formatMagicResolutionMessage
-> SceneDialoguePanel history
-> saveGame
```

If no magical formula is recognized, existing NPC dialogue, merchant, gate, and combat flows continue unchanged.

Pure formulas are valid cast input. `Игнис Ланца Хостис`, `игнис ланца хостис`, `«Игнис Ланца Хостис»`, `Игнис, Ланца, Хостис!`, and `Произношу: Игнис Ланца Хостис.` all normalize to canonical ids `ignis + lancea + hostis`.

Formula routing is blocked for questions, historical/teaching mentions, negation, and trade wording so discussion of magic words does not accidentally cast a spell.

## Client Modules

- `client/src/systems/magic/magicTypes.ts`: word, formula, mastery, player magic, validation, and resolution types.
- `client/src/systems/magic/magicWords.ts`: canonical magic dictionary with Latin words and Russian aliases.
- `client/src/systems/magic/spellDefinitions.ts`: known spell formulas.
- `client/src/systems/magic/magicParser.ts`: extracts formulas from plain text, quotes, punctuation, Latin, and Cyrillic input.
- `client/src/systems/magic/magicValidator.ts`: checks learned words, mastery, formulas, mana, silence, cooldown, forbidden words, and targets.
- `client/src/systems/magic/spellResolver.ts`: rolls d20, spends mana, applies damage/healing/effects, and updates word experience.
- `client/src/systems/magic/spellEffects.ts`: shared helpers for active effects and cooldown ticking.
- `client/src/systems/magic/magicProgression.ts`: default state, starting mage words, and word learning helpers.
- `client/src/systems/magic/magicMessages.ts`: localized player-facing result formatting.

## Starting Mage Knowledge

Mage characters start with:

- Words: `ignis`, `manus`, `minora`, `lumen`, `sphere`, `mea`.
- Formulas: `Игнис Манус Минора` and `Люмен Сфера Минора`.
- Mastery: `understood`.
- Mana: `30 / 30`.
- Grimoire: unlocked.
- Inventory: `magic_apprentice_guide`, a non-consumable readable document with the apprentice combat-word reference image.

Non-mage characters receive `canUseMagic = false`, no known words, and a locked grimoire-ready state so story events can unlock magic later.

## Known Spells

- `spark`: `ignis + manus + minora`, fire damage, no required target.
- `magic_light`: `lumen + sphere + minora`, light effect.
- `fire_lance`: `ignis + lancea + hostis`, target fire damage.
- `minor_heal`: `vitar + sano + minora`, self healing.

Understood words can cast learned formulas. Free combinations require mastered or comprehended words.

## Save Migration

`saveSystem` normalizes `player.magic` on load and save. Old saves without magic receive a class-appropriate default state. Corrupted or unknown word/formula ids are filtered out. The system preserves mana, known words, mastery, word experience, known formulas, custom formulas, active effects, cooldowns, corruption, instability, focus, and grimoire state.

## UI

- NPC scene chat shows mana in the dialogue stats.
- Magic results appear as Game Master messages in the same chat history.
- Inventory includes a compact grimoire section that shows only known words and known formulas.
- The Mage Apprentice Guide can be opened from inventory or as a right-side quick-access panel in scenes while the item is in inventory.
- Mana potions restore mana only when the player can use magic.

## AI Boundary

NPC prompts state that AI must not decide spell recognition, rolls, mana, damage, effects, learning, or failure. The local engine computes the result first; AI/NPC dialogue may only react in character to already resolved outcomes.

## Dev Tools

On localhost, `window.__AI_DND_DEBUG__` includes:

- `grantMagicWord(wordId, masteryLevel?)`
- `restoreMana()`
- `unlockGrimoire()`
- `parseMagic(text)`
- `giveMagicApprenticeGuide()`

## Verification

The project currently has no dedicated `test`, `lint`, or `typecheck` npm scripts. Magic self-test fixtures are stored next to the system and are compiled by TypeScript. `npm run build` runs `tsc --noEmit` and Vite build.

See also: `docs/Systems/MAGIC_WORD_COMBAT.md`.
