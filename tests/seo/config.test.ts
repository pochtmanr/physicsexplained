import { describe, it, expect } from "vitest";
import { SITE } from "@/lib/seo/config";

describe("SITE config", () => {
  it("exposes the production base URL", () => {
    expect(SITE.baseUrl).toBe("https://physics.it.com");
  });

  it("exposes site name and tagline", () => {
    expect(SITE.name).toBe("physics");
    expect(SITE.tagline).toBeTruthy();
  });

  it("buildUrl returns absolute URL for any path", () => {
    expect(SITE.buildUrl("/foo")).toBe("https://physics.it.com/foo");
    expect(SITE.buildUrl("/")).toBe("https://physics.it.com/");
  });

  it("buildUrl handles locale-prefixed paths for non-default locales", () => {
    expect(SITE.localizedUrl("/foo", "en")).toBe("https://physics.it.com/foo");
    expect(SITE.localizedUrl("/foo", "he")).toBe("https://physics.it.com/he/foo");
  });
});
