# Central Settlement

Updated: 2026-07-14

## Merchant Scene Background

The Central Settlement merchant uses a dedicated merchant stall background:

```text
client/public/assets/backgrounds/merchants/central_settlement_merchant_background.png
```

Scene selection is data-driven through `client/src/data/sceneAssets.ts`:

- NPC/event id: `merchant_central_settlement`;
- settlement id: `central_settlement`;
- scene mode: `merchant`;
- background: Central Settlement merchant background.

This background must not be used for the Western Great City merchant, Southern City merchant, or any gate guard.

## Gate Guard Background

The Central Settlement gate guard keeps the settlement gate/location background:

```text
client/public/assets/locations/central_settlement.png
```

Scene selection:

- NPC id: `guard_central_settlement_gate`;
- settlement id: `central_settlement`;
- scene mode: `gate`;
- background: Central Settlement gate/location background.

The guard must not receive a merchant stall background.

## Merchant Layout Notes

In merchant mode:

- the dialogue panel stays bottom-center and compact;
- the trade zone is raised above the dialogue panel;
- the merchant figure is shifted slightly right in the center stage;
- the bottom navigation is aligned to the right;
- Anariel's hint appears in the upper-left part of the central area and does not cover the merchant goods panel.
