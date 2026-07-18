import { t } from "../../../i18n/i18n";
import type { RangedCombatResolutionResult } from "./rangedCombatTypes";

type CombatLogVariant = "hit" | "miss" | "critical";

export type RangedCombatNarrationLogEntry = {
  id: string;
  text: string;
  variant: CombatLogVariant;
  debugData?: Record<string, unknown>;
};

function getRangedCombatDebugData(result: RangedCombatResolutionResult): Record<string, unknown> {
  return {
    d20: result.d20,
    attackTotal: result.attackTotal,
    difficultyClass: result.difficultyClass,
    damage: result.damage,
    damageType: result.damageType,
    staminaSpent: result.staminaSpent,
    ammunitionSpent: result.ammunitionSpent,
    distance: result.distance,
    injuriesApplied: result.injuriesApplied,
    enemyDefeated: result.enemyDefeated,
    parsedAction: result.parsedAction,
  };
}

function formatEnemyDefeated(enemyName: string) {
  return t("combat.narration.ranged.defeated").replace("{enemy}", enemyName);
}

export function formatRangedCombatNarration(result: RangedCombatResolutionResult, enemyName: string) {
  if (!result.ok) {
    return result.validation.ok ? t("combat.narration.actionFailed") : result.validation.message;
  }

  if (result.damage === undefined && result.injuriesApplied.length === 0 && result.narrationHints.length > 0) {
    return t("combat.narration.ranged.utility");
  }

  if (!result.hit) {
    return result.fumble ? t("combat.narration.ranged.fumble") : t("combat.narration.ranged.miss");
  }

  const parts = [
    result.critical ? t("combat.narration.ranged.critical") : t("combat.narration.ranged.hit"),
    result.injuriesApplied.length > 0 ? t("combat.narration.ranged.limbInjury") : "",
    result.enemyDefeated ? formatEnemyDefeated(enemyName) : "",
  ];

  return parts.filter(Boolean).join(" ");
}

export function getRangedCombatLog(result: RangedCombatResolutionResult): RangedCombatNarrationLogEntry[] {
  if (!result.ok) {
    return [
      {
        id: `ranged-combat-blocked-${Date.now()}`,
        text: result.validation.ok ? t("combat.narration.actionFailed") : result.validation.message,
        variant: "miss",
        debugData: getRangedCombatDebugData(result),
      },
    ];
  }

  return [
    {
      id: `ranged-combat-result-${Date.now()}`,
      text: result.hit
        ? result.critical
          ? t("combat.narration.ranged.critical")
          : t("combat.narration.ranged.hit")
        : result.fumble
          ? t("combat.narration.ranged.fumble")
          : t("combat.narration.ranged.miss"),
      variant: result.critical ? "critical" : result.hit ? "hit" : "miss",
      debugData: getRangedCombatDebugData(result),
    },
  ];
}
