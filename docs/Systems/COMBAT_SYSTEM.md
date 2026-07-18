# Combat System

Update date: 2026-07-14

Combat is resolved by the local Game Engine, not by AI. Player text is first parsed into a typed intent, then validated against inventory, equipment, the enemy state, and the current scene context.

Implemented MVP rules:

- Generic "I attack" / "Я атакую" uses the equipped weapon if one is equipped.
- If no weapon is equipped, generic attack falls back to a basic unarmed attack.
- A specific weapon action such as "I draw a sword" or "рублю мечом" is blocked when the required weapon is not equipped.
- Basic unarmed attacks do not require weapon training.
- Kick, shove, grapple, thrown objects, and improvised attacks have explicit action types.
- Throwing a stone checks whether the current scene plausibly has stones or debris.
- Player attacks use d20 + attribute modifier + applicable proficiency.
- Unarmed, kick, shove, and grapple use Strength. Thrown objects use Dexterity.
- Hit, miss, critical hit, damage, enemy defeat, and enemy counterattack are all calculated before narration.
- Enemies counterattack when still alive after the player's action, including after a miss.
- Combat works when Local AI is disabled or unavailable.

The lower dialogue panel shows:

- player action text;
- Game Master narration;
- combat log entries with rolls, success/failure, damage, and enemy response.

Debug logs:

- `[Combat] player action`
- `[Combat] enemy action`
- `[TextCombat] player action`
- `[RangedCombat] player action`

See also:

- `docs/Systems/TEXT_MELEE_COMBAT_SYSTEM.md`
- `docs/Systems/TEXT_RANGED_COMBAT_SYSTEM.md`
