import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/config";

const DISALLOWED_PATHS = [
  "/api/",
  "/auth/",
  "/sign-in",
  "/account",
  "/sandbox",
  "/billing",
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
