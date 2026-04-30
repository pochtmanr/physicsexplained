import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/fetch", () => ({
  getContentEntry: vi.fn(),
}));
vi.mock("@/lib/seo/locale-alternates", () => ({
  getRealLocaleSet: vi.fn(),
}));

import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { getContentEntry } from "@/lib/content/fetch";
import { getRealLocaleSet } from "@/lib/seo/locale-alternates";

describe("makeTopicMetadata", () => {
  it("returns full metadata for a real EN topic", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "The Simple Pendulum",
      subtitle: "Why every clock ticked.",
      blocks: [],
      meta: {},
      localeFallback: false,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/the-simple-pendulum");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });

    expect((meta.title as { absolute: string }).absolute).toContain("The Simple Pendulum");
    expect(meta.description).toBe("Why every clock ticked.");
    expect(meta.alternates?.canonical).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
    expect(meta.openGraph?.url).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
    expect(meta.robots).toBeUndefined();
  });

  it("noindex + canonical-back-to-EN when localeFallback=true", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "The Simple Pendulum",
      subtitle: "Why every clock ticked.",
      blocks: [],
      meta: {},
      localeFallback: true,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/the-simple-pendulum");
    const meta = await fn({ params: Promise.resolve({ locale: "he" }) });

    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
  });

  it("includes hreflang alternates only for sibling locales with real rows", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "Foo",
      subtitle: "Bar",
      blocks: [],
      meta: {},
      localeFallback: false,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en", "he"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/foo");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });

    expect(meta.alternates?.languages).toMatchObject({
      he: "https://physics.it.com/he/classical-mechanics/foo",
    });
  });

  it("returns empty metadata when entry not found", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const fn = makeTopicMetadata("topic", "missing");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });
    expect(meta).toEqual({});
  });
});
