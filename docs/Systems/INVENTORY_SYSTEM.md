# Inventory System

Update date: 2026-07-14

Inventory item creation is engine-owned. NPC and companion text may contain parsed command markers, but a marker is not permission to create an item.

## Authorized Transfers

`client/src/systems/inventory/inventoryRewards.ts` defines `ItemTransferReason`:

- `trade`
- `barter`
- `quest_reward`
- `return_item`
- `scripted_story`
- `loot`
- `service_result`

`addItemToInventory` now requires an authorized transfer with item id, quantity, reason, and source context. Missing authorization blocks the item, strips the AI marker through the parser flow, and logs a development-only warning.

## Missing Icon Policy

Inventory and merchant grids render a visible text fallback when an `iconUrl` is absent or fails to load. The current missing expected asset paths are:

- `/assets/items/quest/rusty_key.png`
- `/assets/items/quest/torn_note.png`
- `/assets/items/clothing/old_cloak.png`
- `/assets/items/weapons/wooden_club.png`
- `/assets/items/weapons/old_dagger.png`

`validateItemAssetPaths()` keeps reporting missing paths for asset intake without breaking the UI.

## Readable Documents

Readable inventory documents are normal inventory items with `readable`, `readContentType`, and `readAssetId` metadata. Reading does not consume the item, spend mana, or advance combat turns.

`magic_apprentice_guide` is registered as a unique document item. It uses `/assets/items/documents/magic_apprentice_guide.png` and can be opened from the inventory or through the scene quick-access panel while the item remains in the player's inventory.

`melee_combat_beginner_guide` is registered as a non-consumable readable document. New characters receive it during character creation. It uses `/assets/items/guides/melee-combat-beginner-guide.png` and powers the disabled/enabled context-guide button in dialogue scenes.

`crossbow_and_bolts_guide` is registered as a non-consumable readable document. New characters receive it during character creation. It uses `/assets/items/guides/crossbow-and-bolts-guide.png` and powers the ranged-combat context-guide button in dialogue scenes.

`light_crossbow` and `common_crossbow_bolt` are registered as engine-owned inventory templates for ranged-combat testing and merchant/debug grants. NPC text cannot grant them unless the reward path supplies an authorized transfer.
