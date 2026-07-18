# NPC Knowledge System

Updated: 2026-07-14

## Purpose

NPC dialogue must respect local world knowledge. NPCs may not invent permanent people, settlements, districts, shops, roads, towers, temples, or other concrete places.

The first protection layer is the Local AI prompt. The second layer validates structured mention markers when the model uses them.

## Registry

The world entity registry is defined in:

```text
client/src/data/worldEntityRegistry.ts
```

It exposes:

- `getNpcByRegistryId(id)`;
- `getLocationById(id)`;
- `getSettlementById(id)`;
- `getKnownNpcsForSettlement(settlementId)`;
- `getKnownLocationsForSettlement(settlementId)`;
- `isRegisteredNpcId(id)`;
- `isRegisteredLocationId(id)`.

The registry is built from existing source data:

- `npcDefinitions`;
- `worldMapNodes`;
- `cityMapLocations`.

It does not create a second lore list. It indexes already registered game entities.

## Knowledge Context

`buildNpcKnowledgeContext(npc, { save, state })` returns a compact context:

- `self`;
- `homeSettlement`;
- `currentSettlement`;
- `knownNpcs`;
- `knownLocations`;
- `knownRoads`;
- `knownFactions`;
- `personalMemories`;
- `verifiedFacts`;
- `rumors`.

The context intentionally does not include the full save, hidden secrets, other NPC memories, or unregistered entities.

## Prompt Rules

`buildNpcSystemPrompt` includes a compact local knowledge block:

- known NPC IDs, names, roles, and usual locations;
- known location IDs, names, and types;
- known factions;
- explicit prohibition against inventing concrete NPCs or places.

Western Great City NPCs know registered Western Great City residents and locations. Central Settlement NPCs know registered Central Settlement residents and locations. NPCs do not automatically know people from another settlement unless future game systems add a reason.

## Marker Validation

`validateNpcWorldReferences(response, context)` checks optional markers:

```text
[[MENTION_NPC:npc_id]]
[[MENTION_LOCATION:location_id]]
```

Known markers are removed from UI text after validation. Unknown markers are ignored and removed. The validator does not try to parse every normal word as a name, which avoids false positives in natural dialogue.

## Boundaries

AI may speak naturally, refuse unknown information, or say that a place is not in the settlement. It may not add permanent NPCs or locations through ordinary dialogue. Dynamic NPC creation remains a future game-engine feature.
