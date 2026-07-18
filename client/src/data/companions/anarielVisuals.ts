import type { GameSave } from "../../systems/save/saveSystem";
import type { PlayerOutfitStage } from "../../types/player";

export const ANARIEL_TRAVEL_RAGS_IMAGE = "/assets/companions/anariel/anariel_travel_rags.png";

const ANARIEL_IMAGE_BY_OUTFIT_STAGE: Record<PlayerOutfitStage, string> = {
  rags: ANARIEL_TRAVEL_RAGS_IMAGE,
  clothes: "/assets/companions/anariel/anariel_travel_clothes.png",
  armor: "/assets/companions/anariel/anariel_travel_armor.png",
};

export function getAnarielImageForCurrentState(save: GameSave | null | undefined) {
  const outfitStage = save?.player.currentOutfitStage ?? "rags";
  const imageUrl = ANARIEL_IMAGE_BY_OUTFIT_STAGE[outfitStage] ?? ANARIEL_TRAVEL_RAGS_IMAGE;

  console.info("[Outfit] Anariel stage changed", {
    outfitStage,
    imageUrl,
  });

  return imageUrl;
}

export function isAnarielActiveCompanion(save: GameSave | null | undefined) {
  const anariel = save?.companions?.anariel;

  return Boolean(
    anariel?.isTravellingWithPlayer ||
      anariel?.status === "companion" ||
      anariel?.status === "rescued",
  );
}
