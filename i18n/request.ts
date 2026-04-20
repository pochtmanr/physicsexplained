import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`../messages/${locale}/common.json`)).default;
  const home = (await import(`../messages/${locale}/home.json`)).default;
  const about = (await import(`../messages/${locale}/about.json`)).default;
  const legal = (await import(`../messages/${locale}/legal.json`)).default;

  return {
    locale,
    messages: { common, home, about, legal },
  };
});
