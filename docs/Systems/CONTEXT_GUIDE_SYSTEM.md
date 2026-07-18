# Context Guide System

Update date: 2026-07-15

Context guides are readable inventory items that can also be opened while a dialogue or event is on screen. The inventory remains the source of truth: a guide button is active only when the matching item exists in `save.inventory.items`.

## Definitions

Guide definitions live in `client/src/systems/inventory/readableItems.ts` as `ContextGuideDefinition`.

Each definition binds:

- stable guide id / item id;
- localized title, description, open, close, and required-item text;
- image asset id through the readable item metadata;
- image alt text.

Current guides:

- `magic_apprentice_guide`
- `melee_combat_beginner_guide`
- `crossbow_and_bolts_guide`
- `archery_basics_guide`

## Assets

Guide images are stored under public assets so Vite can include them in production builds:

- `/assets/items/documents/magic_apprentice_guide.png`
- `/assets/items/guides/melee-combat-beginner-guide.png`
- `/assets/items/guides/crossbow-and-bolts-guide.png`

`archery_basics_guide` currently reuses `/assets/items/guides/crossbow-and-bolts-guide.png` because the supplied ranged parchment covers aiming, arrows, bolts, cover, and ranged combat basics.

Application code never references attachment or Downloads paths.

## Dialogue Integration

`SceneDialoguePanel` exposes `headerActions`. `EventScene` renders guide buttons in that top frame and renders the right-side guide panel at scene level.

Button behavior:

- enabled when the item is present;
- disabled and dimmed when the item is missing;
- toggles the right-side panel;
- exposes `aria-label`, `title`, and `aria-pressed`;
- shows a small unread marker until opened.

## Read State

Read state is stored in `save.contextGuides.readGuideIds`. It is UI metadata only. The item remains in inventory and is not consumed when opened.

Old saves without `contextGuides` normalize to an empty read list.

## Responsive Behavior

Desktop uses a right-side panel. Mobile uses the same panel at nearly full viewport width. Long guide images scroll inside the panel body.

## Testing

Self-test coverage is in `client/src/systems/inventory/readableItems.test.ts` and is compiled by `npm run build`.
