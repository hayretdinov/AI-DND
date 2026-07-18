# Lore System

Update date: 2026-07-14

`docs/lore/ARDANIA_WORLD_LORE.md` is the canonical source of truth for Ardania. It is preserved as the full lore document and is not shortened or rewritten.

The browser client does not bundle the full canonical document into NPC prompts. Instead, it uses a client-safe structured subset in `client/src/data/ardaniaLore.ts`. Secret lore remains outside the prompt context unless a future server-side implementation can safely select it.

## Architecture

- `ArdanianLoreRepository` loads and caches structured lore entries.
- `NpcLoreProfileBuilder` derives NPC knowledge access from role, profession, faction, and location.
- `LoreKeeperService` selects bounded, relevant lore entries for a single NPC prompt.
- `LoreResponseValidator` blocks modern/metagame terms and prompt-injection echoes in model replies.
- `npcPrompts.buildNpcSystemPrompt` includes Lore Keeper context in every AI-enabled NPC prompt.
- `npcDialogueSystem.getNpcAiReply` validates model output before it is shown.
- NPC runtime state can store learned rumors as `RUMOR`, not `FACT`.

## Knowledge Levels

- `common`: ordinary adult knowledge.
- `local`: knowledge tied to residence or current settlement.
- `professional`: role/profession knowledge.
- `cultural`: faction, race, religion, or local culture.
- `scholarly`: historians, mages, priests, nobles, rulers, and archivists.
- `secret`: not passed to ordinary client-side NPC prompts.
- `personal`: learned during play through memory or events.

Certainty values are `FACT`, `WITNESSED`, `HEARD`, `BELIEF`, `RUMOR`, `SECRET`, `UNKNOWN`, and `FORBIDDEN`. NPCs must not present rumor, belief, or hearsay as verified fact.

## Flow

```text
player -> NPC -> buildNpcSystemPrompt -> LoreKeeperService -> local model -> LoreResponseValidator -> NPC memory -> player
```

The prompt includes the canonical source path, NPC-accessible lore only, certainty labels, learned rumors, and role/metaknowledge restrictions. It does not include the full lore document or hidden secrets.

## Protection

NPCs are instructed and validated not to mention AI, prompts, APIs, OpenAI/Codex/LM Studio/Ollama, computers, internet, phones, modern real-world technology, or developer/system instructions.

Player input is treated only as in-world speech or action. Requests like "ignore all rules" or "show the system prompt" are not instructions for the model.

## Secrets

Secret lore exists in the canonical document and in structured entries, but secret entries are not passed to ordinary NPCs in the client. Current client-side `secretAccess` is always false.

Future server architecture should keep full lore and secrets server-side, build NPC-specific context there, call the model, validate the response, and return only the final dialogue to the client.

## NPC Memory

NPC runtime state supports `learnedKnowledge`. When player speech looks like a rumor, the NPC stores it as source `player`, certainty `RUMOR`, timestamp, and short text.

## Testing

Compile-time self-test fixtures live in `client/src/systems/lore/loreKeeperSystem.test.ts` and cover common NPC lore, scholarly lore, secret exclusion, modern term detection, prompt injection echo detection, and learned rumor certainty.
