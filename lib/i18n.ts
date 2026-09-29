import { dictionaries, type Dict } from "./dictionaries";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

export function getDict(lang: Locale): Dict {
  return dictionaries[lang];
}
