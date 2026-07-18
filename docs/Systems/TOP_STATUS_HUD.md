# Top Status HUD

Update date: 2026-07-15

## Purpose

The active event screen now uses a single shared top status row for the main hero and scene indicators. The row is rendered by `TopStatusBar` and individual `StatusIndicator` items in `client/src/components/TopStatusHud.tsx`.

## Indicator Order

The fixed order is:

1. Health
2. Mana
3. Stamina
4. Distance
5. Cover
6. Relationship
7. Trust
8. Fear
9. Hostility

The order is exported as `TOP_STATUS_ORDER` so future checks can assert that the UI did not drift.

## Data Sources

- Health comes from `save.player.combat`.
- Mana comes from `save.player.magic`.
- Stamina, distance, and cover come from `save.player.textCombat`.
- Relationship, trust, fear, and hostility come from the current `NpcInstance`.

Missing combat or magic values are shown as `-` instead of creating a second fallback widget.

## UI Rules

- Event dialogue headers no longer receive these values through `SceneDialoguePanel.stats`.
- Merchant scenes use the same top HUD instead of the old merchant-only status bar.
- The old right-side health section is not rendered in dynamic NPC scenes, so health is not duplicated.
- The top row scrolls horizontally on narrow screens rather than wrapping over the scene.
