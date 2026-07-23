import type { GameSave } from "../save/saveSystem";
import { canEnterGrantedGate } from "./gateAccessSystem";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const save: GameSave = {
  player: {
    id: "player",
    name: "Test",
    origin: "outcast",
    race: "human",
    gender: "male",
    characterClass: "warrior",
    appearance: "wanderer",
    currentOutfitStage: "rags",
    portraitUrl: "",
    attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    derivedStats: { health: 10, stamina: 10, armorClass: 10 },
    createdAt: new Date(0).toISOString(),
  },
};

assert(!canEnterGrantedGate(save, "guard", "gate", "central_settlement"), "Entry must be hidden before permission.");
const allowedSave: GameSave = {
  ...save,
  cityAccess: {
    central_settlement: {
      status: "allowed",
      grantedByNpcId: "central_guard",
      grantedAtGameTime: "day-1-hour-8",
    },
  },
};
assert(canEnterGrantedGate(allowedSave, "guard", "gate", "central_settlement"), "Entry must appear after structured permission.");
assert(!canEnterGrantedGate(allowedSave, "merchant", "gate", "central_settlement"), "A non-guard cannot grant gate entry.");
