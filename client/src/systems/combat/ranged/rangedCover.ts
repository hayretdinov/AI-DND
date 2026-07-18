import type { CoverLevel } from "./rangedCombatTypes";

export function getCoverPenalty(cover: CoverLevel | undefined) {
  if (cover === "partial") {
    return 1;
  }

  if (cover === "half") {
    return 2;
  }

  if (cover === "full") {
    return 6;
  }

  return 0;
}

export function inferCoverFromText(text: string): CoverLevel | undefined {
  if (text.includes("полное укрытие") || text.includes("full cover")) {
    return "full";
  }

  if (text.includes("за стен") || text.includes("за боч") || text.includes("half cover")) {
    return "half";
  }

  if (text.includes("укрыт") || text.includes("прикрыт") || text.includes("cover")) {
    return "partial";
  }

  return undefined;
}
