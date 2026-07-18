import { getLocationEventById } from "../../data/locationEvents";
import { getNpcById } from "../../data/npcs";
import { getSwampMapLocationById } from "../../data/swampMap";
import type { GameSave } from "../save/saveSystem";
import { createNpcCombatState, ensureCombatState, resolveEnemyTurn, syncCombatStateAfterPlayerAction } from "./combatSystem";
import { classifyPostCombatIntent, generateNpcLoot } from "./postCombatSystem";
import { parseTextCombatAction } from "./text/combatActionParser";
import { resolveTextCombatAction } from "./text/combatActionResolver";
import type { NpcInstance } from "../../types/npc";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const definition = getNpcById("skeleton_warrior_01");
assert(definition?.role === "monster" && definition.canUseAiDialogue === false, "Skeleton must be non-sapient and non-dialogue.");
assert(getSwampMapLocationById("sunken_skeleton_grave")?.eventId === "swamp_skeleton_grave", "Swamp map must expose the skeleton encounter.");
assert(getLocationEventById("swamp_skeleton_grave")?.npcId === "skeleton_warrior_01", "Skeleton event must use the existing asset definition.");
const combat = createNpcCombatState("skeleton_warrior_01", "monster");
assert(combat.damageType === "slashing" && combat.damageDice === "1d8", "Skeleton combat profile must match its sword.");
const livingSkeleton: NpcInstance = {
  npcId: "skeleton_warrior_01", instanceId: "skeleton_warrior_01", templateId: "skeleton_warrior_01",
  role: "monster", status: "alive", createdAt: new Date(0).toISOString(), met: true,
  relationship: 0, trust: 0, fear: 0, hostility: 100, dialogueHistory: [], combat,
};
function createSave(strength: number, dexterity = 10): GameSave {
  return { player: {
    id: "player", name: "Test", origin: "outcast", race: "human", gender: "male", characterClass: "warrior",
    appearance: "wanderer", currentOutfitStage: "rags", portraitUrl: "",
    attributes: { strength, dexterity, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
    derivedStats: { health: 12, stamina: 12, armorClass: 10 },
    textCombat: { maxStamina: 12, stamina: 12, stance: "balanced", distance: "melee", balance: 0, knownTechniques: [], detailedRolls: false, injuries: [] },
    createdAt: new Date(0).toISOString(),
  } };
}
const action = parseTextCombatAction("Бью скелета кулаком.");
const originalRandom = Math.random;
Math.random = () => 0.7;
try {
  const weakHit = resolveTextCombatAction(createSave(8), livingSkeleton, action);
  const strongHit = resolveTextCombatAction(createSave(18), livingSkeleton, action);
  assert(weakHit.ok && strongHit.ok && (strongHit.damage ?? 0) > (weakHit.damage ?? 0), "The same unarmed attack must deal more damage with higher Strength.");
  assert((strongHit.npcInstance.combat?.currentHealth ?? combat.maxHealth) < combat.maxHealth, "A successful player action must reduce skeleton HP.");

  const initialTurn = ensureCombatState(strongHit.save, livingSkeleton);
  const afterPlayer = syncCombatStateAfterPlayerAction(initialTurn, strongHit.save, strongHit.npcInstance, {
    actionId: "skeleton-cycle-player", actionType: "meleeAttack", outcome: strongHit.hit ? "success" : "miss",
  });
  assert(afterPlayer.phase === "resolvingEnemyTurns", "The skeleton must receive its turn after the player action.");
  const afterSkeleton = resolveEnemyTurn(strongHit.save, strongHit.npcInstance, afterPlayer);
  assert(afterSkeleton.combatState.phase === "awaitingPlayerAction", "Control must return to the player after the skeleton turn.");

  const lowDexTurn = ensureCombatState(createSave(10, 8), livingSkeleton);
  const highDexTurn = ensureCombatState(createSave(10, 18), livingSkeleton);
  assert(highDexTurn.combatants.player.initiative > lowDexTurn.combatants.player.initiative, "Dexterity must change player initiative.");
} finally {
  Math.random = originalRandom;
}
assert(classifyPostCombatIntent("Обыскиваю останки.") === "searchCorpse", "Searching remains must route to post-combat loot.");
const instance: NpcInstance = {
  npcId: "skeleton_warrior_01", instanceId: "skeleton_warrior_01", templateId: "skeleton_warrior_01",
  role: "monster", status: "dead", createdAt: new Date(0).toISOString(), met: true,
  relationship: 0, trust: 0, fear: 0, hostility: 100, dialogueHistory: [], combat,
};
const lootIds = generateNpcLoot(instance).items.map((item) => item.templateId);
assert(lootIds.includes("rusty_sword"), "Skeleton loot must include its rusty sword.");
assert(!lootIds.includes("monster_meat"), "Skeleton loot must never include monster meat.");
