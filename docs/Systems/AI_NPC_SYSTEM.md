# AI NPC System

Update date: 2026-07-14

NPC replies are generated or selected as text only. Game state changes are handled by local systems.

## Response Pipeline

The current response order is:

1. Raw model response or deterministic fallback.
2. Safe command parsing, which strips markers from visible text.
3. Lore and world validation.
4. `sanitizeAiResponseForWorld`.
5. Final clean text is shown in UI and saved to NPC memory.

Raw model text, command markers, and technical local AI errors are not saved to dialogue history.

## In-World Refusals

`client/src/systems/ai/inWorldResponseSanitizer.ts` replaces meta refusals such as "As an AI" or "I cannot continue this topic" with role-appropriate in-world lines for guards, merchants, mages, priests, Edran, Anariel, monsters, Game Master narration, and generic NPCs.

The sanitizer intentionally does not replace normal world phrases such as city rules, not knowing a person, or refusing to discuss a king.
