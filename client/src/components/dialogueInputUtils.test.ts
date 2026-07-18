import { isBlankDialogueMessage, shouldSubmitDialogueKey } from "./dialogueInputUtils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(isBlankDialogueMessage(""), "Empty message must be blank.");
assert(isBlankDialogueMessage("   \n\t"), "Whitespace-only message must be blank.");
assert(!isBlankDialogueMessage("Здравствуйте"), "Russian text must be accepted.");
assert(!isBlankDialogueMessage("A long trader message with spaces"), "Long text must be accepted.");
assert(shouldSubmitDialogueKey("Enter", false, false), "Enter must submit.");
assert(!shouldSubmitDialogueKey("Enter", true, false), "Shift+Enter must not submit.");
assert(!shouldSubmitDialogueKey("Enter", false, true), "IME composition Enter must not submit.");
assert(!shouldSubmitDialogueKey("Space", false, false), "Other keys must not submit.");
