import { en } from "./en";

export type Locale = "en";

const STRINGS: Record<Locale, typeof en> = {
  en,
};

export type Strings = typeof en;

export const getStrings = (locale: Locale = "en"): Strings =>
  STRINGS[locale] ?? en;

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
