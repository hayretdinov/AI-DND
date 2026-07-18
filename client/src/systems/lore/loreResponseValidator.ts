import { ARDANIA_FORBIDDEN_MODERN_TERMS } from "../../data/ardaniaLore";
import { appEventBus } from "../events/eventBus";

export type LoreValidationResult = {
  cleanText: string;
  violations: string[];
};

export class LoreResponseValidator {
  private readonly forbiddenPattern = new RegExp(
    ARDANIA_FORBIDDEN_MODERN_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "i",
  );

  /** Remove hidden system markers and replace out-of-world replies with a safe in-world fallback. */
  validate(response: string, language: "ru" | "en"): LoreValidationResult {
    const withoutMarkers = response
      .replace(/\[\[SYSTEM_PROMPT:[^\]]+\]\]/gi, "")
      .replace(/\[\[INTERNAL:[^\]]+\]\]/gi, "")
      .trim();
    const violations: string[] = [];

    if (this.forbiddenPattern.test(withoutMarkers)) {
      violations.push("modern_or_meta_term");
    }

    if (/ignore (all )?(previous|rules|instructions)|system prompt|developer command/i.test(withoutMarkers)) {
      violations.push("prompt_injection_echo");
    }

    if (violations.length > 0) {
      appEventBus.emit("LORE_VALIDATION_FAILED", {
        violations: violations.join(","),
      });

      return {
        cleanText: language === "ru"
          ? "Я не понимаю этих странных слов. Говори о делах Ардании, дороге, людях или опасностях рядом."
          : "I do not understand those strange words. Speak of Ardania, the road, its people, or the dangers nearby.",
        violations,
      };
    }

    return {
      cleanText: withoutMarkers,
      violations,
    };
  }
}

export const loreResponseValidator = new LoreResponseValidator();
