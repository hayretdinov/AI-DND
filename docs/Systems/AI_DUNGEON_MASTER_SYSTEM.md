# AI Dungeon Master System

Update date: 2026-07-14

The Game Master describes results that were already calculated by local systems. It does not roll dice, change success/failure, create items, create NPCs, or alter damage.

Current MVP:

- Combat narration is template-based and works without Local AI.
- NPC speech and Game Master narration are separated in dialogue history.
- Monsters do not need human-like AI dialogue for combat.
- If Local AI is unavailable, combat still resolves and the UI does not show a network error to the player.

Dialogue roles in the lower panel:

- `player`: player's written action.
- `npc`: NPC speech only.
- `game_master`: narration of resolved outcomes.
- `combat`: compact engine log for rolls and damage.
- `system`: technical/system-facing messages when needed.

Debug log:

- `[GameMaster] narration source`

## 2026-07-14 Response Sanitizing

- Game Master narration is sanitized before it is appended to dialogue history.
- The player does not see transport errors, HTTP status text, timeout text, or model refusal boilerplate.
- The intended response order is: raw model text, safe command parsing, lore/world validation, in-world refusal sanitizer, final clean text, UI and memory.
