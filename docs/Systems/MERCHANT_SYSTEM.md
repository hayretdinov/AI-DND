# Merchant System

Updated: 2026-07-14

## Purpose

Merchant gameplay is handled by the game engine, not by the AI model. The AI merchant may speak, haggle, react to tone, and remember trade behavior, but item movement, price calculation, gold transfer, and save updates are owned by `MerchantSystem`.

## Merchant Scene Layout

The merchant screen is rendered by `EventScene` when the active dynamic event has `type: "merchant"` and the active NPC role is `merchant`.

The layout follows the supplied visual reference:

- left panel: merchant goods;
- center stage: merchant figure over the stall background and the active trade zone;
- right panel: player inventory;
- bottom center: standard dialogue panel for free-text negotiation;
- bottom navigation: Inventory, City Map, World Map, Journal, Settings.

Merchant backgrounds are selected through `client/src/data/sceneAssets.ts`, by concrete NPC/event identity rather than by `role === "merchant"`.

The Western Great City merchant keeps the previous stall background:

```text
client/public/assets/locations/merchant_stall.png
```

The Central Settlement merchant uses its own supplied background:

```text
client/public/assets/backgrounds/merchants/central_settlement_merchant_background.png
```

The Central Settlement gate guard uses the gate/settlement background:

```text
client/public/assets/locations/central_settlement.png
```

## Visibility Rules

The root merchant scene uses a fixed `100dvh` layout and hides overflow. Scrolling is allowed only inside item grids and dialogue messages.

The trade footer is outside the item scroll areas. The `Trade` / `Confirm Trade` button is always visible in the trade footer:

- disabled while there is no accepted deal;
- enabled only when `activeDeal.dealState === "accepted"`;
- never covered by the dialogue panel or bottom navigation.

The trade zone is raised above the dialogue panel, the merchant figure is shifted slightly to the right inside the center stage, and the bottom navigation is aligned to the right side of the lower UI area.

## Inventory Panels

Merchant goods are rendered from `merchantState.items` only. The UI does not create display-only test items and does not show items outside the merchant inventory.

Player inventory is rendered from `save.inventory.items`. It shows item name, quantity, estimated value, weight, and equipped state when applicable. The footer shows total carried weight and current gold.

## Trade Flow

1. The player drags an item from either inventory into the trade zone.
2. `createMerchantDeal` creates an engine-owned offer.
3. The player may haggle through free text.
4. `respondToTradeText` updates the merchant offer and `dealState`.
5. The trade button becomes enabled only after the merchant accepts.
6. `confirmMerchantDeal` transfers the item and gold once.
7. Refusing a deal clears the active deal and records trade history.

## Save Behavior

Merchant state is persisted through the existing save system:

- merchant inventory;
- merchant gold;
- relationship and trade memory;
- active deal;
- trade history.

Unfinished deals are kept as state, but item and gold transfer happens only through final confirmation.

## 2026-07-14 Hardening

- The dialogue panel uses the shared transparent dialogue background token and is enlarged on merchant scenes so messages scroll inside the panel while the input and exchange buttons remain visible.
- Approximate prices are shown through `merchant.approximatePrice` with a `priceText` range.
- Haggling uses merchant relationship, trust, and player charisma. Insulting free, too-low, or too-high offers close negotiation through `negotiation_closed`.
- Confirmed trade creates transferred item instances with `origin: "trade"`.
- Merchant text commands cannot grant free items; inventory movement is still owned by `confirmMerchantDeal`.

## 2026-07-15 Trader Dialogue UI

- Merchant scenes keep the existing `SceneDialoguePanel` but add a merchant-only layout class so the dialogue occupies the lower scene width instead of competing with narrow trade columns.
- The trade layout is reserved above the dialogue with a larger bottom offset, preventing merchant goods, player inventory, and the center trade area from covering the textarea.
- The dialogue panel uses a flex layout in merchant scenes: header, scrollable history, optional actions/notices, and a fixed composer.
- Message history auto-scrolls only while the player is near the bottom; manual reading of older messages is no longer interrupted by new renders.
- `Enter` sends, `Shift+Enter` inserts a newline, and IME composition is guarded.
- Sending is protected against duplicate submits through the shared panel's local submitting state and the existing NPC thinking state.
- If the AI reply request fails, the typed message remains in the textarea and the panel shows `dialogue.sendError`.
- Global guide hotkeys now ignore editable targets, so typing in the merchant textarea is not consumed by scene-level keyboard handlers.
- Detailed UI notes are documented in `docs/Systems/TRADER_DIALOGUE_UI.md`.
