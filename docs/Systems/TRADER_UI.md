# Trader UI

Update date: 2026-07-15

## Layout

Merchant scenes still use `EventScene` and the existing merchant trade engine. The visible trade layout now has two active areas:

- center stage: merchant image plus transparent deal drop zone;
- right panel: tabbed item selection.

The old separate visible left player inventory column is removed from the player-facing layout.

## Tabs

The right panel owns the trade mode tabs:

- `Купить` / `Buy`: shows `merchantState.items` and starts `player_buys` deals.
- `Продать` / `Sell`: shows `save.inventory.items` and starts `player_sells` deals.

Switching tabs clears the current active merchant deal so the selected item does not leak between buy and sell modes.

## Deal Confirmation

The transparent deal zone only shows the selected item, approximate price, quantity, and deal state. It does not contain confirm/refuse buttons.

Final confirmation remains inside the shared `SceneDialoguePanel` action area after the merchant accepts the deal. This keeps confirmation as part of the conversation flow and preserves the shared dialogue component.

## Trade Logic

The UI continues to call the existing handlers:

- `createMerchantDeal`
- `respondToTradeText`
- `confirmMerchantDeal`
- `upsertMerchant`

No separate inventory, merchant state, or trade engine was introduced.

## Verification

- `npm.cmd run build` passed from `client`.
- `npm.cmd run preview -- --host 127.0.0.1 --port 4173` served the app.
- `Invoke-WebRequest http://127.0.0.1:4173/` returned HTTP 200.
