# Text Ranged Combat System

Update date: 2026-07-15

The text ranged combat system lets the player describe shots, aiming, reloading, cover, and distance in natural chat text. The local game engine parses and resolves the mechanics. AI narration receives only the final result text and does not decide hit, miss, damage, ammunition, or death.

## Routing

`EventScene` routes player text in this order:

1. System/game commands already handled by the scene.
2. Magic formulas.
3. Ranged combat text.
4. Melee text combat.
5. Legacy intent/action/dialogue flow.

Ranged combat is considered only in combat-capable NPC scenes such as bandits, monsters, and guards.

## Supported Gear

Supported weapon categories:

- `handCrossbow`
- `lightCrossbow`
- `huntingCrossbow`
- `heavyCrossbow`
- `shortBow`
- `longBow`
- `throwingWeapon`

The initial concrete templates are:

- `light_crossbow`
- `common_crossbow_bolt`

Weapon state is stored under `save.player.textCombat.ranged.weapons[weaponId]` and tracks loaded/cocked state, loaded ammo, reload stage, durability, jam state, and aim state. Old saves normalize to an empty ranged state.

## Resolution

The engine parses:

- intent: aim, shoot, quick shot, precise shot, power shot, prepared shot, reload, cover, movement;
- weapon and ammo hints;
- body zones;
- stance and movement;
- claimed outcomes, which are treated as intent rather than fact.

Validation checks:

- living target;
- equipped ranged weapon;
- compatible ammunition;
- loaded/cocked crossbow state;
- stamina;
- distance;
- line of fire.

Resolution uses:

- d20;
- Dexterity modifier by default;
- weapon training proficiency;
- weapon accuracy;
- aim and stance modifiers;
- distance and cover penalties;
- body-zone difficulty;
- armor-piercing value.

The result updates stamina, ammunition, weapon loaded state, NPC health, injuries, and combat log entries before narration.

## Guide Item

`crossbow_and_bolts_guide` is a readable image item using:

`client/public/assets/items/guides/crossbow-and-bolts-guide.png`

The guide appears as a dialogue header button only when the item exists in inventory. Read/unread state is saved in `contextGuides.readGuideIds`.

## Developer Tools

On localhost, `window.__AI_DND_DEBUG__` includes:

- `parseRangedCombatAction(text)`
- `giveCrossbowAndBoltsGuide()`
- `giveLightCrossbow()`
- `giveCommonCrossbowBolts(quantity)`

## Tests

Compile-time self-tests:

- `client/src/systems/combat/ranged/rangedCombatSystem.test.ts`
- `client/src/systems/inventory/readableItems.test.ts`
