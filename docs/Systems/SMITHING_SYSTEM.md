# Smithing System

The central settlement blacksmith Dultran introduces basic blacksmithing.

## Flow

- The NPC `central_blacksmith_dultran` is placed at `central_blacksmith` on the central settlement city map.
- Before training, the forge mini-game is locked.
- Basic training sets `player.smithing.hasBasicTraining` and `player.smithing.miniGameUnlocked`.
- After training, the player can start a small clicker job inside the NPC dialogue action area.

## Mini-Game

Stages:

- `heat`: 3 clicks
- `hammer`: 5 clicks
- `quench`: 2 clicks

Completing all stages increments `completedJobs` and grants a small reward from the smithing reward cycle.

## Save Compatibility

Old saves are normalized with an empty smithing state by `normalizeSmithingProgression`.

## Dev Tools

Available on localhost under `window.__AI_DND_DEBUG__`:

- `openCentralBlacksmith()`
- `grantSmithingTraining()`
- `resetSmithingTraining()`
- `openSmithingMiniGame()`
- `completeSmithingMiniGame()`
- `giveNewTaskItems()`
- `forceTravelEvent(eventId)`
- `getTravelEventChance()`
