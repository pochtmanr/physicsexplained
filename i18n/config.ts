export const locales = ["en", "he"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Locales that render right-to-left. */
export const rtlLocales = ["he"] as const satisfies readonly Locale[];

export function isRtlLocale(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}
