import { describe, it, expect } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
  buildDefinedTermJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/jsonld";

describe("buildArticleJsonLd", () => {
  it("emits an Article with required Schema.org fields", () => {
    const out = buildArticleJsonLd({
      url: "https://physics.it.com/classical-mechanics/the-simple-pendulum",
      headline: "The Simple Pendulum",
      description: "Why every clock ticked.",
      datePublished: "2026-04-11T00:00:00Z",
      dateModified: "2026-04-12T00:00:00Z",
      locale: "en",
      image: "https://physics.it.com/.../opengraph-image",
      about: ["Pendulum", "Classical mechanics"],
    });
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("Article");
    expect(out.headline).toBe("The Simple Pendulum");
    expect(out.description).toBe("Why every clock ticked.");
    expect(out.inLanguage).toBe("en");
    expect(out.datePublished).toBe("2026-04-11T00:00:00Z");
    expect(out.dateModified).toBe("2026-04-12T00:00:00Z");
    expect(out.publisher["@type"]).toBe("Organization");
    expect(Array.isArray(out.about)).toBe(true);
    expect((out.about as { name: string }[])[0].name).toBe("Pendulum");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("emits a BreadcrumbList with positioned items", () => {
    const out = buildBreadcrumbJsonLd([
      { name: "physics", url: "https://physics.it.com" },
      { name: "Classical Mechanics", url: "https://physics.it.com/classical-mechanics" },
      { name: "The Simple Pendulum" },
    ]);
    expect(out["@type"]).toBe("BreadcrumbList");
    expect(out.itemListElement).toHaveLength(3);
    expect(out.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "physics",
      item: "https://physics.it.com",
    });
    expect(out.itemListElement[2]).toMatchObject({ position: 3, name: "The Simple Pendulum" });
    expect((out.itemListElement[2] as Record<string, unknown>).item).toBeUndefined();
  });
});

describe("buildPersonJsonLd", () => {
  it("emits a Person with biographical fields", () => {
    const out = buildPersonJsonLd({
      url: "https://physics.it.com/physicists/isaac-newton",
      name: "Isaac Newton",
      birthDate: "1643-01-04",
      deathDate: "1727-03-31",
      nationality: "English",
      description: "Calculus, optics, gravity.",
      image: "https://physics.it.com/.../og.png",
      sameAs: ["https://en.wikipedia.org/wiki/Isaac_Newton"],
      knowsAbout: ["Calculus", "Optics"],
    });
    expect(out["@type"]).toBe("Person");
    expect(out.name).toBe("Isaac Newton");
    expect(out.birthDate).toBe("1643-01-04");
    expect(out.sameAs).toEqual(["https://en.wikipedia.org/wiki/Isaac_Newton"]);
  });
});

describe("buildDefinedTermJsonLd", () => {
  it("emits a DefinedTerm wired to the dictionary set", () => {
    const out = buildDefinedTermJsonLd({
      url: "https://physics.it.com/dictionary/angular-momentum",
      name: "Angular momentum",
      description: "L = r × p.",
      slug: "angular-momentum",
    });
    expect(out["@type"]).toBe("DefinedTerm");
    expect(out.termCode).toBe("angular-momentum");
    expect((out.inDefinedTermSet as { url: string }).url).toBe(
      "https://physics.it.com/dictionary",
    );
  });
});

describe("buildWebSiteJsonLd", () => {
  it("emits a WebSite with SearchAction", () => {
    const out = buildWebSiteJsonLd();
    expect(out["@type"]).toBe("WebSite");
    expect(out.url).toBe("https://physics.it.com");
    expect((out.potentialAction as { "@type": string })["@type"]).toBe("SearchAction");
  });
});
