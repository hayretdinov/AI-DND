export type Language = "ru" | "en";

export type LanguageOption = {
  code: Language;
  label: string;
};

export const LANGUAGES: LanguageOption[] = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];
