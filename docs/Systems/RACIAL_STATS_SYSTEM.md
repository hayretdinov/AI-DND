# Racial Stats System

Starting races are limited to the races already exposed by character creation:

- Human
- Elf
- Dwarf
- Orc

Race data lives in `client/src/data/raceDefinitions.ts`.

The system separates:

- `baseAttributes` - neutral starting baseline.
- `allocatedAttributes` - player-spent creation points.
- `racialModifiers` - race bonus or penalty.
- `attributes` - final value used by gameplay.
- `statsSchemaVersion` - migration marker for saves.

Old saves are normalized in `client/src/systems/save/saveSystem.ts`. If an old save has only final attributes, the loader infers allocation and then reapplies the current race definition. No new race ids are introduced.
