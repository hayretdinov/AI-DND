# Royal Court and Western Great City NPCs

Update date: 2026-07-13

This registry adds persistent NPCs for the Western Great City. Each NPC uses a stable `templateId === instanceId`, so dialogue history and runtime state remain separate between meetings.

## NPC List

| ID | Name | Role | Interior location | Asset |
|---|---|---|---|---|
| `king_aldric_iv` | King Aldric IV | ruler | `royal_throne_hall` | `/assets/npcs/royal_court/king_aldric_iv.png` |
| `high_mage_elyrion` | High Mage Elyrion | mage | `circle_of_archons_tower` | `/assets/npcs/royal_court/high_mage_elyrion.png` |
| `high_priest_solan` | High Priest Solan | priest | `great_temple` | `/assets/npcs/royal_court/high_priest_solan.png` |
| `archmage_tarvis` | Archmage Tarvis | mage | `private_arcane_study` | `/assets/npcs/royal_court/archmage_tarvis.png` |
| `general_vargas` | General Vargas | military | `military_headquarters` | `/assets/npcs/royal_court/general_vargas.png` |
| `lord_commander_cedric` | Lord Commander Cedric | military | `royal_guard_headquarters` | `/assets/npcs/royal_court/lord_commander_cedric.png` |
| `imperial_chancellor_orton` | Imperial Chancellor Orton | noble | `royal_chancellery` | `/assets/npcs/royal_court/imperial_chancellor_orton.png` |
| `queen_miranda` | Queen Miranda | ruler | `royal_private_chambers` | `/assets/npcs/royal_court/queen_miranda.png` |
| `prince_leon` | Prince Leon | noble | `royal_palace` | `/assets/npcs/royal_court/prince_leon.png` |
| `archive_keeper_edran` | Keeper of the Ancient Archive Edran | scholar | `ancient_archive` | `/assets/npcs/royal_court/archive_keeper_edran.png` |
| `western_city_blacksmith` | Western Great City Blacksmith | blacksmith | `western_city_forge` | `/assets/npcs/royal_court/blacksmith.png` |

The blacksmith has a prepared asset path but no source image was supplied in this task.

## Data Model

- Templates are registered in `client/src/data/royalCourtNpcs.ts`.
- The shared NPC registry imports them through `client/src/data/npcs.ts`.
- Per-NPC knowledge, traits, fears, goals, relationships, and quest seeds live in `royalCourtProfiles`.
- Save migration ensures missing persistent states are added under `save.npcs.instances[id]`.
- Existing NPC state is not overwritten.

## Knowledge Rules

Each profile separates knowledge into `expert`, `good`, `basic`, and `unknown`. AI prompts include these limits and still obey global rules: no dice rolls, no item creation, no direct world-state mutation, and no quest menu.

## Relationship Graph

Relationships are stored as ID lists: `allies`, `rivals`, `family`, `subordinates`, and `superiors`. The graph is prompt context and world data. It does not force political outcomes by itself.

## Quest Seeds

Quest seeds are world problems revealed through conversation, rumors, documents, or events. They are not UI buttons.

## EventScene Access

Each NPC has a location event id:

```text
royal_court_<npcId>
```

In dev mode, a helper opens the shared EventScene:

```js
window.__AI_DND_DEBUG__.openNpc("king_aldric_iv")
```
