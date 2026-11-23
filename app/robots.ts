import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/config";
import { defaultLocale, locales } from "@/i18n/config";

// Paths under the default locale have no prefix; every other locale repeats
// them under `/<locale>`.
const PRIVATE_PAGES = ["/sign-in", "/account", "/sandbox", "/billing", "/ask"];

const DISALLOWED_PATHS = [
  "/api/",
  "/auth/",
  ...PRIVATE_PAGES,
  ...locales
    .filter((l) => l !== defaultLocale)
    .flatMap((l) => PRIVATE_PAGES.map((p) => `/${l}${p}`)),
];

// AI assistants and their crawlers are explicitly welcome: being cited by
// ChatGPT/Claude/Perplexity et al. is a distribution goal for this site.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE.baseUrl}/sitemap.xml`,
    host: SITE.baseUrl,
  };
}
