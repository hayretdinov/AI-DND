# Text Melee Combat System

## Purpose

The text melee combat system lets the player describe combat actions in the NPC chat, while deterministic game code decides the result. The language model may narrate or react only after the engine has parsed, validated, rolled, and applied the action.

Example player action:

```text
Резко шагаю вперёд и наношу короткий рубящий удар мечом по правой руке разбойника.
```

The phrase is treated as intent. Claims such as "Отрубаю ему голову" do not guarantee death, decapitation, disarm, or any other final outcome.

## Flow

1. `EventScene` receives player chat text.
2. Magic parsing runs first, preserving the magic system.
3. `parseTextCombatAction` checks whether the text is a combat action.
4. `resolveTextCombatAction` normalizes the action, validates the scene, consumes stamina, checks distance, rolls d20, applies damage and injuries, and updates save/NPC state.
5. `formatTextCombatNarration` builds the Game Master message from the deterministic result.
6. The old `parsePlayerIntent` and `resolvePlayerAttack` path remains as a fallback for simple legacy combat commands.

## Main Modules

- `client/src/systems/combat/text/combatTextTypes.ts`: shared combat action, stance, distance, body zone, injury, and result types.
- `combatVocabulary.ts`: Russian and English keyword vocabulary.
- `combatActionParser.ts`: deterministic intent parser.
- `combatActionNormalizer.ts`: default weapon, attack type, zone, and movement normalization.
- `combatActionValidator.ts`: weapon, NPC, distance, stamina, overload, and training checks.
- `combatActionResolver.ts`: d20 resolution, damage, stamina, NPC state, and enemy reaction.
- `combatDistance.ts`: distance shifts and weapon distance penalties.
- `combatStamina.ts`: stamina defaults and costs.
- `combatTargeting.ts`: body zone difficulty and damage modifiers.
- `combatInjuries.ts`: bleeding, fracture, concussion, shield damage, disarm, knockdown, stagger, limb injury, deep wound, puncture, and guard break outcomes.
- `combatNarrationContext.ts`: deterministic Game Master narration and combat log entries.

## Saved State

Player saves now include optional `player.textCombat`:

- `stamina` / `maxStamina`
- `stance`
- `distance`
- `balance`
- `knownTechniques`
- `injuries`
- `detailedRolls`

NPC instances may include optional `npc.textCombat`:

- `stance`
- `distance`
- `balance`
- `injuries`
- `telegraphedAction`

`saveSystem` normalizes missing values, so old saves remain loadable.

## Deterministic Boundaries

The NPC prompt explicitly tells Local AI:

- do not roll dice;
- do not decide melee hit, damage, injuries, death, disarm, knockdown, or enemy reactions;
- react only to outcomes already produced by the game.

## Dev Tools

On `localhost`, `window.__AI_DND_DEBUG__` exposes:

- `parseCombatAction(text)`
- `restoreCombatStamina()`
- `grantCombatTechnique(techniqueId)`
- `setCombatDistance(distance)`
- `setCombatStance(stance)`
- `applyCombatInjury(injury)`
- `clearCombatInjuries()`

## Manual Scenario

1. Start or continue a save.
2. Enter a hostile NPC scene.
3. Equip a trained weapon.
4. Type a detailed attack in chat, for example:

```text
Резко шагаю вперёд и наношу короткий рубящий удар мечом по правой руке разбойника.
```

Expected:

- the parser detects `weaponStrike`;
- distance and stamina update;
- d20 outcome is hidden unless `detailedRolls` is enabled;
- body-zone difficulty affects hit chance;
- hit damage can apply a limb injury;
- the NPC dialogue history stores the cleaned Game Master result;
- simple legacy commands like "атакую" still use the previous combat fallback if the rich parser does not match.
