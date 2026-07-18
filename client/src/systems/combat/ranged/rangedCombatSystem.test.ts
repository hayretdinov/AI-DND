import { parseRangedCombatAction } from "./rangedActionParser";
import { normalizeRangedCombatAction } from "./rangedActionNormalizer";
import { createDefaultPlayerRangedCombatState, normalizePlayerRangedCombatState } from "./rangedWeaponState";

const parsedShot = normalizeRangedCombatAction(
  parseRangedCombatAction("Прицеливаюсь из арбалета и стреляю обычным болтом в корпус разбойника"),
);

if (parsedShot.intent === "unknown") {
  throw new Error("Ranged parser should recognize crossbow shooting text.");
}

if (parsedShot.weaponCategory !== "lightCrossbow") {
  throw new Error("Ranged parser should infer a light crossbow from generic crossbow text.");
}

if (parsedShot.targetZone !== "torso") {
  throw new Error("Ranged parser should normalize missing or torso body zones.");
}

const parsedReload = parseRangedCombatAction("Перезаряжаю арбалет бронебойным болтом");

if (parsedReload.intent !== "reload" || parsedReload.ammoCategory !== "armorPiercingBolt") {
  throw new Error("Ranged parser should recognize reload intent and requested bolt type.");
}

const defaultState = createDefaultPlayerRangedCombatState();
const normalizedState = normalizePlayerRangedCombatState({ ...defaultState, cover: "half" });

if (normalizedState.cover !== "half") {
  throw new Error("Ranged combat state should preserve a valid cover level.");
}
