import type { NpcRole } from "../../types/npc";
import type { CityId } from "../../types/city";
import type { GameSave } from "../save/saveSystem";

export function canEnterGrantedGate(
  save: GameSave | null | undefined,
  npcRole: NpcRole | undefined,
  eventType: string | undefined,
  destinationId: CityId | undefined,
) {
  return Boolean(
    save
      && npcRole === "guard"
      && eventType === "gate"
      && destinationId
      && save.cityAccess?.[destinationId]?.status === "allowed",
  );
}
