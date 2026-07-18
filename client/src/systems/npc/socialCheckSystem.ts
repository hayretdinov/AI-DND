import type { NpcInstance, NpcSocialCheckOutcome, NpcSocialCheckType } from "../../types/npc";
import type { PlayerIntent } from "../intent/playerIntentSystem";
import type { GameSave } from "../save/saveSystem";
import { getAttributeModifier, rollD20 } from "../combat/diceSystem";
import { resolveEffectivePlayerStats } from "../player/effectivePlayerStats";

export type SocialCheckResult = {
  type: NpcSocialCheckType;
  outcome: NpcSocialCheckOutcome;
  relationshipDelta: number;
  trustDelta: number;
  fearDelta: number;
  hostilityDelta: number;
  messageKey: "socialCheck.success" | "socialCheck.partial" | "socialCheck.failure";
  relevantStat: "strength" | "intelligence" | "wisdom" | "charisma";
  blockedReason?: "deadTarget" | "nonSapientTarget";
};

function clampMetric(value: number) {
  return Math.max(-100, Math.min(100, value));
}

export function getSocialCheckType(intent: PlayerIntent): NpcSocialCheckType | null {
  if (/обманыва|лгу|вру|притворя|deceiv|lie|pretend/i.test(intent.rawText)) {
    return "deception";
  }
  if (intent.type === "persuade" || intent.type === "negotiate" || intent.type === "bribe" || intent.type === "request_city_entry") {
    return "persuasion";
  }
  if (intent.type === "intimidate" || intent.type === "threaten") {
    return "intimidation";
  }
  if (intent.type === "observe") {
    return "insight";
  }
  if (intent.type === "inspect") {
    return "knowledge";
  }
  return null;
}

export function resolveSocialCheck(
  save: GameSave,
  npc: NpcInstance,
  type: NpcSocialCheckType,
  playerText: string,
  options: { roll?: number; difficultyModifier?: number } = {},
): { npc: NpcInstance; result: SocialCheckResult } {
  const attributes = resolveEffectivePlayerStats(save.player, save.inventory);
  const blockedReason = npc.status === "dead" || npc.status === "gone" ? "deadTarget" : npc.role === "monster" ? "nonSapientTarget" : undefined;
  const physicalIntimidation = type === "intimidation" && /лома|сжима|мышц|оружи|сил[ау]|break|muscle|weapon|physical/i.test(playerText);
  const relevantStat = physicalIntimidation ? "strength" : type === "insight" ? "wisdom" : type === "knowledge" ? "intelligence" : "charisma";
  const attribute = attributes[relevantStat];
  const rolled = options.roll ?? rollD20();
  const total = rolled + getAttributeModifier(attribute);
  const difficulty = 10 + Math.round(npc.hostility / 20) - Math.round(npc.trust / 25) - Math.round(npc.relationship / 30) - (type === "intimidation" ? Math.round(npc.fear / 25) : 0) + (options.difficultyModifier ?? 0);
  const outcome: NpcSocialCheckOutcome = blockedReason || rolled === 1
    ? "criticalFailure"
    : rolled === 20
      ? "criticalSuccess"
      : total >= difficulty + 6
        ? "criticalSuccess"
        : total >= difficulty + 3
          ? "success"
          : total >= difficulty
            ? "partialSuccess"
            : "failure";
  const isIntimidation = type === "intimidation";
  const deltas = outcome === "criticalSuccess"
    ? { relationshipDelta: isIntimidation ? -1 : 5, trustDelta: isIntimidation ? -2 : 4, fearDelta: isIntimidation ? 8 : 0, hostilityDelta: -4 }
    : outcome === "success"
    ? { relationshipDelta: isIntimidation ? -1 : 3, trustDelta: isIntimidation ? -2 : 2, fearDelta: isIntimidation ? 6 : 0, hostilityDelta: -2 }
    : outcome === "partialSuccess"
      ? { relationshipDelta: isIntimidation ? -1 : 1, trustDelta: 0, fearDelta: isIntimidation ? 3 : 0, hostilityDelta: 0 }
      : outcome === "criticalFailure"
        ? { relationshipDelta: -5, trustDelta: -4, fearDelta: 0, hostilityDelta: 6 }
        : { relationshipDelta: -3, trustDelta: -2, fearDelta: isIntimidation ? 1 : 0, hostilityDelta: 3 };
  const result: SocialCheckResult = {
    type,
    outcome,
    ...deltas,
    messageKey: outcome === "success" || outcome === "criticalSuccess" ? "socialCheck.success" : outcome === "partialSuccess" ? "socialCheck.partial" : "socialCheck.failure",
    relevantStat,
    blockedReason,
  };

  if (blockedReason) {
    return { npc, result };
  }

  return {
    result,
    npc: {
      ...npc,
      relationship: clampMetric(npc.relationship + result.relationshipDelta),
      trust: clampMetric(npc.trust + result.trustDelta),
      fear: clampMetric(npc.fear + result.fearDelta),
      hostility: clampMetric(npc.hostility + result.hostilityDelta),
      lastSocialCheck: {
        type,
        outcome,
        playerText: playerText.slice(0, 240),
        resolvedAt: new Date().toISOString(),
      },
    },
  };
}
