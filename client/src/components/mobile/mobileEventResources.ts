import type { PlayerCharacter } from "../../types/player";

export type MobilePlayerResource = {
  id: "health" | "mana" | "stamina";
  current: number;
  max: number;
  percent: number;
};

function normalizeResource(current: number | undefined, max: number | undefined) {
  const safeMax = Math.max(0, Math.floor(Number.isFinite(max) ? Number(max) : 0));
  const safeCurrent = Math.min(
    safeMax,
    Math.max(0, Math.floor(Number.isFinite(current) ? Number(current) : safeMax)),
  );

  return {
    current: safeCurrent,
    max: safeMax,
    percent: safeMax > 0 ? Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100)) : 0,
  };
}

export function getMobilePlayerResources(player: PlayerCharacter | undefined): MobilePlayerResource[] {
  const fallbackHealth = player?.derivedStats.health ?? 1;
  const fallbackStamina = player?.derivedStats.stamina ?? 0;

  return [
    {
      id: "health",
      ...normalizeResource(player?.combat?.currentHealth ?? fallbackHealth, player?.combat?.maxHealth ?? fallbackHealth),
    },
    {
      id: "mana",
      ...normalizeResource(player?.magic?.mana, player?.magic?.maxMana),
    },
    {
      id: "stamina",
      ...normalizeResource(player?.textCombat?.stamina ?? fallbackStamina, player?.textCombat?.maxStamina ?? fallbackStamina),
    },
  ];
}
