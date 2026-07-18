# Trader Dialogue UI

Updated: 2026-07-15

Merchant scenes use the same `SceneDialoguePanel` component and the same dialogue classes as ordinary NPC and event dialogue.

The conversation area must not use a merchant-only dialogue component or a `merchant-dialogue-panel` styling branch. Merchant inventory, deal, price and navigation UI can keep merchant-specific layout, but the conversation itself stays on the shared dialogue system.

Current shared dialogue behavior:

- Message history is rendered by `.scene-dialogue-messages` with `role="log"` and `aria-live="polite"`.
- Auto-scroll follows new messages only while the user is already near the bottom.
- `Enter` submits, `Shift+Enter` inserts a new line, and IME composition is respected.
- Empty and whitespace-only messages are blocked before submission.
- After a send attempt finishes, focus returns to the textarea.
- If the NPC AI request fails, the typed text is kept and `dialogue.sendError` is shown.

Do not reintroduce merchant-only dialogue positioning, opacity, width, or composer rules. If the shared dialogue needs a behavior change, update `SceneDialoguePanel` and the shared scene dialogue styles instead.
