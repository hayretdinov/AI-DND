import { t, type TranslationKey } from "../../i18n/i18n";
import type { SpellResolutionResult } from "./magicTypes";

function formatTemplate(key: TranslationKey, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [token, value]) => text.replace(`{${token}}`, String(value)), t(key));
}

export function formatMagicResolutionMessage(result: SpellResolutionResult) {
  if (!result.validation.ok) {
    return t(result.validation.messageKey as TranslationKey);
  }

  if (!result.ok) {
    return t(result.narrationKey as TranslationKey);
  }

  const spellName = t(result.validation.spell.nameKey as TranslationKey);

  if (result.damage && result.damage > 0) {
    return formatTemplate("magic.message.castDamage" as TranslationKey, {
      spell: spellName,
    });
  }

  if (result.healing && result.healing > 0) {
    return formatTemplate("magic.message.castHealing" as TranslationKey, {
      spell: spellName,
    });
  }

  return formatTemplate("magic.message.castUtility" as TranslationKey, {
    spell: spellName,
  });
}
