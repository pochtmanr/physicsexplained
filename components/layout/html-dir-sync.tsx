"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { getDirection } from "@/i18n/config";

/**
 * Syncs `dir` and `lang` on <html> to the active next-intl locale.
 *
 * The root layout sets these attributes server-side on first render, but
 * Next's App Router doesn't re-render the root layout on client-side
 * navigation — so when the locale changes via router.replace(), the
 * translations update but `<html dir>` stays stale. This component lives
 * inside the locale segment and runs an effect on every locale change.
 */
export function HtmlDirSync() {
  const locale = useLocale();

  useEffect(() => {
    const dir = getDirection(locale);
    if (document.documentElement.dir !== dir) {
      document.documentElement.dir = dir;
    }
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
