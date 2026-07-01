import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import { SITE } from "@/lib/seo/config";

const EXPECTED_DISALLOWS = [
  "/api/",
  "/auth/",
  "/sign-in",
  "/account",
  "/sandbox",
  "/billing",
];

describe("robots.txt", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  it("keeps the catch-all rule with existing disallows", () => {
    const catchAll = rules.find((r) => r.userAgent === "*");
    expect(catchAll).toBeDefined();
    expect(catchAll?.allow).toBe("/");
    expect(catchAll?.disallow).toEqual(EXPECTED_DISALLOWS);
  });

  it("explicitly allows the major AI crawlers", () => {
    const aiRule = rules.find(
      (r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"),
    );
    expect(aiRule).toBeDefined();
    for (const ua of [
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
    ]) {
      expect(aiRule?.userAgent).toContain(ua);
    }
    expect(aiRule?.allow).toBe("/");
    expect(aiRule?.disallow).toEqual(EXPECTED_DISALLOWS);
  });

  it("points at the sitemap and host on the canonical domain", () => {
    expect(result.sitemap).toBe(`${SITE.baseUrl}/sitemap.xml`);
    expect(result.host).toBe(SITE.baseUrl);
  });
});
