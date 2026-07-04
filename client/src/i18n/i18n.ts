import type { Language } from "./languages";
import { en } from "./translations/en";
import { ru } from "./translations/ru";

const LANGUAGE_STORAGE_KEY = "ai-dnd-language";
const DEFAULT_LANGUAGE: Language = "ru";
const translations = { ru, en };

export type TranslationKey = {
  [Key in keyof typeof ru]: (typeof ru)[Key] extends string ? Key : never;
}[keyof typeof ru];

function isLanguage(value: string | null): value is Language {
  return value === "ru" || value === "en";
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getLanguage(): Language {
  const storage = getStorage();

  if (!storage) {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = storage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
}

export function setLanguage(language: Language) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function t(key: TranslationKey) {
  return translations[getLanguage()][key] ?? translations[DEFAULT_LANGUAGE][key];
}
