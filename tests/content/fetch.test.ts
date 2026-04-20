// tests/content/fetch.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const selectMock = vi.fn();
const eqMock = vi.fn(() => ({ eq: eqMock, maybeSingle: () => ({ data: null, error: null }) }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: fromMock },
  storageUrl: (p: string) => `/storage/${p}`,
}));

describe("getContentEntry", () => {
  beforeEach(() => {
    fromMock.mockClear();
    selectMock.mockClear();
    selectMock.mockReturnValue({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
  });

  it("returns null when row is missing", async () => {
    const { getContentEntry } = await import("@/lib/content/fetch");
    const entry = await getContentEntry("topic", "classical-mechanics/kepler", "en");
    expect(entry).toBeNull();
  });

  it("falls back to English when requested locale is missing", async () => {
    const { getContentEntry } = await import("@/lib/content/fetch");
    const calls: string[] = [];
    selectMock.mockImplementation(() => ({
      eq: (_col: string, _val: string) => ({
        eq: (_c2: string, _v2: string) => ({
          eq: (_c3: string, locale: string) => ({
            maybeSingle: async () => {
              calls.push(locale);
              if (locale === "he") return { data: null, error: null };
              return {
                data: {
                  kind: "topic",
                  slug: "classical-mechanics/kepler",
                  locale: "en",
                  title: "Kepler",
                  subtitle: null,
                  blocks: [],
                  aside_blocks: [],
                  meta: {},
                  source_hash: "abc",
                  updated_at: new Date().toISOString(),
                },
                error: null,
              };
            },
          }),
        }),
      }),
    }));
    const entry = await getContentEntry("topic", "classical-mechanics/kepler", "he");
    expect(calls).toEqual(["he", "en"]);
    expect(entry?.title).toBe("Kepler");
    expect(entry?.localeFallback).toBe(true);
  });
});
