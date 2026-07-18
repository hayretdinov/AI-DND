import { TRAVEL_EVENT_CHANCE, travelEvents } from "../../data/travelEvents";
import type { WorldMapNodeId } from "../../data/worldMap";
import type { PendingRandomTravelEvent } from "../../types/events";

const MIN_TRIGGER_PROGRESS = 0.4;
const MAX_TRIGGER_PROGRESS = 0.6;

export function rollRandomTravelEvent(fromId: WorldMapNodeId, targetId: WorldMapNodeId): PendingRandomTravelEvent | null {
  const roll = Math.random();

  console.info("[TravelEvent] roll", { roll, chance: TRAVEL_EVENT_CHANCE, fromId, targetId });

  if (roll > TRAVEL_EVENT_CHANCE) {
    return null;
  }

  const totalWeight = travelEvents.reduce((total, event) => total + Math.max(1, event.weight ?? 1), 0);
  let eventRoll = Math.random() * totalWeight;
  const event =
    travelEvents.find((candidate) => {
      eventRoll -= Math.max(1, candidate.weight ?? 1);
      return eventRoll <= 0;
    }) ?? travelEvents[0];
  const triggerProgress = MIN_TRIGGER_PROGRESS + Math.random() * (MAX_TRIGGER_PROGRESS - MIN_TRIGGER_PROGRESS);

  return {
    eventId: event.id,
    npcTemplateId: event.npcId,
    fromId,
    targetId,
    triggerProgress,
  };
}
