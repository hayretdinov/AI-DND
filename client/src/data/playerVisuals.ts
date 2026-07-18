import type { PlayerCharacter, PlayerOutfitStage } from "../types/player";

const visualByAppearance: Record<PlayerCharacter["appearance"], string> = {
  wanderer: "starting",
  ash: "clothing",
  iron: "armor",
};

const visualByOutfitStage: Record<PlayerOutfitStage, string> = {
  rags: "starting",
  clothes: "clothing",
  armor: "armor",
};

export function getPlayerPortraitUrlForOutfit(player: PlayerCharacter, outfitStage = player.currentOutfitStage) {
  if (!player.race || !player.gender || !player.appearance) {
    return "";
  }

  const visual = outfitStage
    ? visualByOutfitStage[outfitStage]
    : visualByAppearance[player.appearance] ?? "starting";

  return `/assets/characters/player/${player.race}/${player.gender}/${player.race}-${player.gender}-${visual}.png`;
}
