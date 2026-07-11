import { TRAVEL_EVENT_CHANCE, travelEvents } from "../../data/travelEvents";
import type { WorldMapNodeId } from "../../data/worldMap";
import type { ActiveEventContext } from "../../types/events";

export function rollRandomTravelEvent(pendingTravelTargetId: WorldMapNodeId): ActiveEventContext | null {
  if (Math.random() > TRAVEL_EVENT_CHANCE) {
    return null;
  }

  const event = travelEvents[Math.floor(Math.random() * travelEvents.length)] ?? travelEvents[0];

  return {
    eventId: event.id,
    npcId: event.npcId,
    returnTo: "worldMap",
    pendingTravelTargetId,
  };
}
