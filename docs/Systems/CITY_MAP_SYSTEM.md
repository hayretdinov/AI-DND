# City Map System

Update date: 2026-07-14

City entry is driven by saved city access state.

Gate flow:

1. WorldMap opens a gate EventScene.
2. The player talks to the guard.
3. Local game logic updates `save.cityAccess[cityId].status`.
4. If the status is `allowed`, a separate context action appears.
5. The `Enter` / `Пройти` button opens `CityMapScene`.

The enter button must not depend on:

- Local AI availability;
- the last NPC reply;
- dialogue history length;
- transient chat state.

Current UI rule:

- `canEnterCity = isGateScene && cityId && cityAccess[cityId].status === "allowed"`
- the button is rendered in `event-context-actions`, above the lower dialogue panel.

Debug log:

- `[CityGate] enter button state`

