# Player Progression System

## Authoritative state

Player progression is stored in the existing game save at `player.progression`:

```ts
type PlayerProgressionState = {
  level: number;
  experience: number;
  skillPoints: number;
  processedRewardIds: string[];
  processedTransactionIds: string[];
  journal: ProgressionJournalEntry[];
};
```

Mobile and desktop interfaces read the same state. Event, combat and trainer
components do not keep separate copies of experience, level or skill points.

## Level progression

The required experience for the next level is calculated in one place:

```ts
100 + (level - 1) * 50
```

`addPlayerExperience` accepts positive integer rewards, carries excess
experience forward, supports several level-ups in one operation and grants one
skill point per gained level.

## Reward sources

Rewards are issued only by structured game events:

- combat victory: `combat:<combatId>`;
- quest completion API: `quest:<questId>`;
- first location discovery: `discovery:<locationId>`;
- successful social check: `social:<eventId>`;
- successful blacksmith mini-game: `smithing:<attemptId>`.

Combat experience comes from `NpcDefinition.experienceReward`, not from the
display name or AI response. Defeat, escape, unfinished combat, looting and
reopening a combat result do not grant experience.

The project does not currently contain a complete quest state machine.
`grantQuestCompletionExperience` is the single structured integration point for
future quest completion transitions and already prevents duplicate rewards.

## Duplicate protection

Processed reward IDs and training transaction IDs are persisted in the save.
React rerenders, repeated callbacks, page reloads and reopening a result cannot
repeat an already recorded reward or payment.

Each successful experience grant is also appended to the bounded progression
journal. The journal stores the reason, category, source ID, experience gained,
level change and awarded skill points.

## Trainers

Trainer requirements are declared as `TrainingRequirement`. Existing trainer
prices are preserved and augmented with player-level requirements.

Before training, the system checks:

- the trainer offers the next tier;
- the previous tier is learned;
- the player level is high enough;
- enough skill points are available;
- enough gold is available.

Training uses one deterministic transaction ID. Requirements are checked before
any mutation, then skill points and gold are deducted and the tier is learned.
Repeated callbacks cannot deduct resources twice.

## Save migration

Save normalization creates a valid progression state for old saves:

- level defaults to `1`;
- experience defaults to `0`;
- skill points default to `0`;
- invalid and negative values are clamped;
- legacy `player.trainerProgression.skillPoints` is migrated to
  `player.progression.skillPoints`.

Inventory, gold, location, NPC relationships, companion state and other save
data are retained.

## Verification

Vitest coverage is located in
`client/tests/playerProgressionSystem.test.ts`. It covers level thresholds,
excess experience, multiple levels, duplicate rewards, combat rewards, quest,
discovery and social deduplication, trainer requirements, atomic payment and
save migration/persistence.
