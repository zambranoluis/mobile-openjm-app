export const languages = ["en", "es", "pt", "hi", "zh", "ru"] as const;
export type Language = (typeof languages)[number];
export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  hi: "हिन्दी",
  zh: "中文",
  ru: "Русский",
};
export function language(value: unknown): Language {
  return languages.includes(value as Language) ? (value as Language) : "en";
}
export function translated(
  copy: Record<string, Partial<Record<Language, string>>>,
  source: string,
  selected: Language,
) {
  return copy[source]?.[selected] ?? source;
}
