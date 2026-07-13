export type AiGameCommand =
  | { type: "giveItem"; itemId: string; quantity: number }
  | { type: "rewardGold"; amount: number };

const GIVE_ITEM_PATTERN = /\[\[GIVE_ITEM:([a-z0-9_-]+):(\d{1,2})\]\]/gi;
const REWARD_GOLD_PATTERN = /\[\[REWARD_GOLD:(\d{1,3})\]\]/gi;

function clampQuantity(value: number) {
  return Math.min(5, Math.max(1, Math.floor(value)));
}

function clampGold(value: number) {
  return Math.min(50, Math.max(1, Math.floor(value)));
}

export function parseAiGameCommands(text: string): { cleanText: string; commands: AiGameCommand[] } {
  const commands: AiGameCommand[] = [];

  for (const marker of text.matchAll(GIVE_ITEM_PATTERN)) {
    if (!isItemId(marker[1])) {
      console.warn("[AiCommandParser] Unknown item marker ignored", { itemId: marker[1] });
      continue;
    }

    commands.push({
      type: "giveItem",
      itemId: marker[1],
      quantity: clampQuantity(Number(marker[2])),
    });
  }

  for (const marker of text.matchAll(REWARD_GOLD_PATTERN)) {
    commands.push({
      type: "rewardGold",
      amount: clampGold(Number(marker[1])),
    });
  }

  const cleanText = text
    .replace(GIVE_ITEM_PATTERN, "")
    .replace(REWARD_GOLD_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleanText, commands };
}
import { isItemId } from "../../data/itemRegistry";
