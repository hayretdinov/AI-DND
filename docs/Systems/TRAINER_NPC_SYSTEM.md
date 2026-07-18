# Trainer NPC System

Update date: 2026-07-15

Trainer NPCs are persistent mentor characters opened through the existing city map and `EventScene` dialogue flow. They do not replace NPC dialogue, merchant logic, inventory, combat, magic, or saves.

## Trainer Roster

Central Settlement:

- `edgar_swordmaster` / Master Sword Edgar: melee training from `basic` through `master`.
- `iara_archer` / Archer Iara: archery training from `basic` through `master`.
- `arkel_magister` / Magister Arkel: basic magic training only.

Western Great City:

- `high_mage_elyrion`: expert and master magic.
- `archmage_tarvis`: intermediate and advanced magic.
- `general_vargas`: intermediate, advanced, expert, and master melee.
- `lord_commander_cedric`: master melee only.

## Progression State

Trainer progress is stored on `player.trainerProgression`:

- `skillPoints`: unspent points used by advanced lessons.
- `spentSkillPoints`: audit counter for spent points.
- `learnedTiers`: learned tiers per branch: melee, archery, magic.
- `freeBasicTrainerIds`: trainers whose free basic lesson was already used.
- `receivedGuideItemIds`: guide items granted by trainers.
- `trainerAgreements`: per-NPC accepted/refused training access state.

Old saves are normalized through `normalizeTrainerProgression` in `saveSystem.ts`.

## Costs

`basic` training is free for the assigned beginner trainers. Higher tiers require gold and skill points:

- `intermediate`: 25 gold, 1 skill point.
- `advanced`: 60 gold, 2 skill points.
- `expert`: 120 gold, 3 skill points.
- `master`: 250 gold, 5 skill points.

Gold is spent through `spendPlayerGold`; item rewards are granted only through `addUniqueInventoryItem`.

## UI Flow

Training no longer appears automatically on the first conversation. The player must ask for training through the free chat first. `chatIntentRouter` routes those phrases as `trainingRequest`; `EventScene` accepts that route only for trainer NPCs and blacksmith scenes.

If the NPC agrees, `trainerAgreements[npcId].status` is saved as `accepted`, and the training or smithing action area appears inside `SceneDialoguePanel` actions. If the player refuses or uses a negated request, the saved state is `refused` and the action area remains hidden. Reopening a scene with an accepted agreement shows the training controls again so the player can continue.

Pressing a lesson button writes a player action and a Game Master result into the same NPC dialogue history. If the lesson succeeds, save state, inventory guide items, combat training, magic words, and trainer progression are updated immediately.

Trainer Local AI prompts explicitly state that dialogue cannot grant training, items, skill points, spells, or mastery. The local engine owns those changes.

## Guides

Beginner trainers grant readable guide items:

- Edgar grants `melee_combat_beginner_guide`.
- Iara grants `archery_basics_guide`, which currently reuses the supplied ranged guide asset.
- Arkel grants `magic_apprentice_guide`.

Arkel's basic magic lesson also unlocks the beginner combat formula `fire_lance` (`ignis + lancea + hostis`) and the required words for it. Characters who first unlock magic through training receive starter mana so the learned formula can pass normal mana validation.

## Debug

On `localhost`, `window.__AI_DND_DEBUG__.grantTrainerSkillPoints(amount)` can add trainer skill points for manual checks of higher tiers.

## Testing

Self-test coverage is in `client/src/systems/trainers/trainerSystem.test.ts` and is compiled by `npm run build`.
