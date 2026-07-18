# Non-Sapient Monster Combat

Non-sapient monsters do not use NPC AI dialogue, but they do use the shared `SceneDialoguePanel` as combat input. `combatInputPolicy.ts` keeps `canUseNpcDialogue` separate from `canUseCombatInput`.

- Before combat and during `awaitingPlayerAction`, the existing textarea accepts free Russian or English action text.
- During player resolution and enemy turns it is disabled, not removed.
- After `resolveEnemyTurn` returns to `awaitingPlayerAction`, the same textarea becomes active again.
- Dead monsters never start human dialogue; Game Master narration and post-combat actions remain available.

## Swamp Skeleton

The existing `/assets/npcs/skeleton_warrior.png` asset is used by `skeleton_warrior_01`. The unique `sunken_skeleton_grave` point on the existing swamp map opens `swamp_skeleton_grave`. The skeleton is a non-speaking monster with 14 HP, AC 13, a `1d8` slashing attack, and rusty-sword loot. Its template-specific loot prevents the generic monster-meat fallback.

The event uses the persistent NPC instance id, so status and remaining loot survive saves and the one-time skeleton does not respawn after defeat.
