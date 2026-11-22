import { describe, it, expect } from "vitest";
import { SUPPORT_PRODUCTS, storePlatforms } from "@/components/support/products";
import { SITE } from "@/lib/seo/config";
import { buildOrganizationJsonLd, buildIosAppJsonLd } from "@/lib/seo/jsonld";
import { buildAlternates } from "@/lib/seo/alternates";
import en from "@/messages/en/home.json";
import he from "@/messages/he/home.json";
import enCommon from "@/messages/en/common.json";
import heCommon from "@/messages/he/common.json";

describe("promoted products", () => {
  it("every product has an https web link and only https store links", () => {
    for (const p of SUPPORT_PRODUCTS) {
      expect(p.links.web).toMatch(/^https:\/\//);
      for (const url of Object.values(p.links)) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });

  it("points at the current listings", () => {
    const byKey = Object.fromEntries(SUPPORT_PRODUCTS.map((p) => [p.key, p]));
    expect(byKey.doppler.links).toEqual({
      web: "https://www.dopplervpn.org/en",
      ios: "https://apps.apple.com/app/doppler-vpn/id6757091773",
      android: "https://play.google.com/store/apps/details?id=org.dopplervpn.android",
    });
    expect(byKey.smsCode.name).toBe("SMS Code");
    expect(byKey.smsCode.links).toEqual({
      web: "https://simnetiq.xyz/",
      ios: "https://apps.apple.com/app/id6803515179",
    });
    expect(storePlatforms(byKey.smsCode)).toEqual(["ios"]);
    expect(storePlatforms(byKey.doppler)).toEqual(["ios", "android"]);
  });

  it("has copy for every product in every routed locale", () => {
    for (const p of SUPPORT_PRODUCTS) {
      for (const home of [en, he]) {
        const copy = (home.support.products as Record<string, { description: string; cta: { web: string } }>)[p.key];
        expect(copy.description.length).toBeGreaterThan(10);
        expect(copy.cta.web.length).toBeGreaterThan(3);
      }
      for (const common of [enCommon, heCommon]) {
        expect((common.aside.products as Record<string, string>)[p.key]).toBeTruthy();
        expect((common.footer.products as Record<string, string>)[p.key]).toBeTruthy();
      }
    }
  });
});

describe("company identity", () => {
  it("uses the simnetiq.com domain everywhere", () => {
    expect(SITE.company.url).toBe("https://simnetiq.com");
    expect(SITE.company.email).toBe("support@simnetiq.com");
    const org = buildOrganizationJsonLd();
    expect(org.parentOrganization).toMatchObject({
      "@type": "Organization",
      name: "Simnetiq Ltd",
      url: "https://simnetiq.com",
    });
    expect(JSON.stringify(org)).not.toContain("simnetiq.store");
  });

  it("describes the iOS app as a free SoftwareApplication", () => {
    const app = buildIosAppJsonLd();
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.offers).toMatchObject({ price: "0" });
    expect(app.url).toContain("apps.apple.com");
  });
});

describe("buildAlternates", () => {
  it("is self-canonical with self + x-default for fully translated pages", () => {
    expect(buildAlternates("/dictionary", "he")).toEqual({
      canonical: "https://physics.it.com/he/dictionary",
      languages: {
        en: "https://physics.it.com/dictionary",
        he: "https://physics.it.com/he/dictionary",
        "x-default": "https://physics.it.com/dictionary",
      },
    });
  });

  it("canonicalises to English when the locale has no real translation", () => {
    expect(buildAlternates("/about", "he", ["en"])).toEqual({
      canonical: "https://physics.it.com/about",
      languages: {
        en: "https://physics.it.com/about",
        "x-default": "https://physics.it.com/about",
      },
    });
  });

  it("handles the home page", () => {
    expect(buildAlternates("/", "en").canonical).toBe("https://physics.it.com/");
    expect(buildAlternates("/", "he").canonical).toBe("https://physics.it.com/he");
  });
});
