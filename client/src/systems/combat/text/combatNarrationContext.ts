import { t } from "../../../i18n/i18n";
import type { TextCombatResolutionResult } from "./combatTextTypes";

type CombatLogVariant = "hit" | "miss" | "critical";

export type CombatNarrationLogEntry = {
  id: string;
  text: string;
  variant: CombatLogVariant;
  debugData?: Record<string, unknown>;
};

function getTextCombatDebugData(result: TextCombatResolutionResult): Record<string, unknown> {
  return {
    d20: result.d20,
    attackTotal: result.attackTotal,
    difficultyClass: result.difficultyClass,
    damage: result.damage,
    damageType: result.damageType,
    staminaSpent: result.staminaSpent,
    distance: result.distance,
    playerStance: result.playerStance,
    npcStance: result.npcStance,
    injuriesApplied: result.injuriesApplied,
    enemyDefeated: result.enemyDefeated,
    parsedAction: result.parsedAction,
  };
}

function formatEnemyDefeated(enemyName: string) {
  return t("combat.narration.melee.defeated").replace("{enemy}", enemyName);
}

export function formatTextCombatNarration(result: TextCombatResolutionResult, enemyName: string) {
  if (!result.ok) {
    return result.validation.ok ? t("combat.narration.actionFailed") : result.validation.message;
  }

  if (!result.hit) {
    return result.fumble ? t("combat.narration.melee.fumble") : t("combat.narration.melee.miss");
  }

  const parts = [
    result.critical ? t("combat.narration.melee.critical") : t("combat.narration.melee.hit"),
    result.injuriesApplied.length > 0 ? t("combat.narration.melee.limbInjury") : "",
    result.enemyDefeated ? formatEnemyDefeated(enemyName) : "",
    result.parsedAction.warnings.includes("claimedOutcome") ? t("combat.narration.claimedOutcome") : "",
  ];

  return parts.filter(Boolean).join(" ");
}

export function getTextCombatLog(result: TextCombatResolutionResult): CombatNarrationLogEntry[] {
  if (!result.ok) {
    return [
      {
        id: `text-combat-blocked-${Date.now()}`,
        text: result.validation.ok ? t("combat.narration.actionFailed") : result.validation.message,
        variant: "miss",
        debugData: getTextCombatDebugData(result),
      },
    ];
  }

  return [
    {
      id: `text-combat-result-${Date.now()}`,
      text: result.hit
        ? result.critical
          ? t("combat.narration.melee.critical")
          : t("combat.narration.melee.hit")
        : result.fumble
          ? t("combat.narration.melee.fumble")
          : t("combat.narration.melee.miss"),
      variant: result.critical ? "critical" : result.hit ? "hit" : "miss",
      debugData: getTextCombatDebugData(result),
    },
  ];
}
