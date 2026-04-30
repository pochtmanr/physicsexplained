import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getRealLocaleSet } from "@/lib/seo/locale-alternates";
import { supabase } from "@/lib/supabase";

describe("getRealLocaleSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns set of locales where a real row exists for (kind, slug)", async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ locale: "en" }, { locale: "he" }],
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(fromMock);

    const result = await getRealLocaleSet("topic", "the-simple-pendulum");
    expect(result.has("en")).toBe(true);
    expect(result.has("he")).toBe(true);
  });

  it("returns only en when no other locales have real rows", async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ locale: "en" }],
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(fromMock);

    const result = await getRealLocaleSet("topic", "kepler");
    expect(Array.from(result)).toEqual(["en"]);
  });
});
