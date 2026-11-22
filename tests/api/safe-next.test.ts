import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next";

const ORIGIN = "https://physics.it.com";

describe("safeNextPath", () => {
  it("never returns something that resolves to another origin", () => {
    const hostile = ["/.//evil.com", "/a/b/../..//evil.com", "/././/evil.com/x?y#z"];
    for (const next of hostile) {
      const out = safeNextPath(next, ORIGIN);
      expect(new URL(out, ORIGIN).origin).toBe(ORIGIN);
    }
  });

  it("keeps same-site paths, including query and hash", () => {
    expect(safeNextPath("/account", ORIGIN)).toBe("/account");
    expect(safeNextPath("/he/ask?c=1#top", ORIGIN)).toBe("/he/ask?c=1#top");
  });

  it("falls back to / when missing or empty", () => {
    expect(safeNextPath(null, ORIGIN)).toBe("/");
    expect(safeNextPath("", ORIGIN)).toBe("/");
  });

  it.each([
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "/\\/evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    // Dot segments that normalise to a protocol-relative path.
    "/.//evil.com",
    "/..//evil.com",
    "/a/..//evil.com",
    "/%2e//evil.com",
    "/%2e%2e//evil.com",
    "/.///evil.com",
  ])("rejects off-site target %j", (next) => {
    expect(safeNextPath(next, ORIGIN)).toBe("/");
  });
});
