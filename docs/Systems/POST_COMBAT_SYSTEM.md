# Post Combat System

## Purpose

Post-combat logic separates defeat from death.

An intelligent NPC reduced to 0 HP is not automatically dead. The NPC becomes `defeated`, `unconscious`, or `surrendered`, remembers the outcome, and can continue a post-combat dialogue. A monster or unintelligent creature does not continue human dialogue.

## Life States

Combat and NPC state now support:

- `active`
- `wounded`
- `incapacitated`
- `unconscious`
- `surrendered`
- `defeated`
- `dead`

The scene HUD shows the current enemy HP and life state.

## Post-Combat Phases

`PostCombatPhase` supports:

- `none`
- `playerDefeated`
- `npcDefeatedAlive`
- `enemyDead`
- `monsterDefeated`
- `loot`
- `dialogue`
- `exit`

When the player is defeated, the enemy NPC stores that it won. When the NPC is defeated alive, combat stops and the NPC no longer attacks.

## Dialogue Rules

Alive defeated intelligent NPCs can answer, surrender, negotiate, or give up a part of their equipment.

Dead NPCs cannot speak. Any further player message is answered only by the Game Master.

Supported post-combat intents include:

- execute the defeated NPC
- search the corpse
- take one loot item
- take all loot
- demand equipment
- release the defeated NPC
- bind the defeated NPC
- leave the scene

## Loot Rules

Loot is generated from NPC equipment/profile, not random AI text.

Examples:

- archer: bow and arrows
- dagger bandit: dagger
- swordsman: sword and shield
- monster: non-human material only when available

Loot uses the existing `InventoryState.items` structure. Taking loot moves real `InventoryItem` objects to the player inventory and removes them from the NPC loot state, so the same item cannot be duplicated.

## Changed Systems

- `client/src/types/combat.ts`
- `client/src/types/npc.ts`
- `client/src/systems/combat/postCombatSystem.ts`
- `client/src/systems/combat/combatSystem.ts`
- `client/src/systems/combat/text/combatActionResolver.ts`
- `client/src/systems/combat/ranged/rangedActionResolver.ts`
- `client/src/systems/magic/spellResolver.ts`
- `client/src/screens/EventScene.tsx`
- `client/src/systems/save/saveSystem.ts`
