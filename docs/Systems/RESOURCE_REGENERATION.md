# Resource Regeneration

Update date: 2026-07-16

Mana and combat stamina regenerate through the existing game-time save flow, not through render frames.

## Source of Time

The system uses `currentDay` and `currentHour` from `GameSave`.

- `getGameMinute(save)` converts day/hour into a stable game-minute counter.
- `resourceRegeneration.lastProcessedGameMinute` stores the last processed game time.
- If old saves do not have `resourceRegeneration`, normalization initializes it at the current game time and does not grant free offline resources.

## Modes

`applyResourceRegeneration(save, { mode })` supports:

- `normal`: world travel and ordinary save normalization.
- `combat`: reserved for combat-time recovery if a later combat turn system advances time.
- `rest`: reserved for short rest actions.
- `sleep`: used by camp rest until dawn.

## Rates and Delays

The config lives in `client/src/systems/resources/resourceRegeneration.ts`.

- Mana uses a base per-game-minute rate plus the character's `magic.manaRegeneration / 60`.
- Stamina uses a base per-game-minute rate from the config.
- Values are clamped to `maxMana` and `textCombat.maxStamina`.
- Fractional gains are stored as remainders so gradual regeneration is not lost.
- Spending mana blocks mana regeneration for a short game-time delay.
- Spending combat stamina blocks stamina regeneration for a short game-time delay.

## Integration Points

- `saveSystem.ts` normalizes and applies regeneration whenever a save is loaded or written.
- `CampScene.tsx` saves camp rest with `mode: "sleep"`.
- `spellResolver.ts` marks mana as recently spent after a spell consumes mana.
- `combatActionResolver.ts` and `rangedActionResolver.ts` mark stamina as recently spent after valid stamina-consuming actions.

## Safety

The system does not use real-world offline time and does not run duplicate timers. It only reacts to game-time changes already produced by existing travel/rest code.
