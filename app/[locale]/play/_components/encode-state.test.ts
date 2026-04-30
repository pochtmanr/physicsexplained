import { describe, expect, it } from "vitest";
import { z } from "zod";
import { encodeState, decodeState } from "./encode-state";

const flatSchema = z.object({
  L: z.number().default(1.0),
  theta: z.number().default(0.3),
  mode: z.enum(["small", "exact"]).default("exact"),
});

const blobSchema = z.object({
  preset: z.string().default("figure-8"),
  bodies: z.array(z.object({ id: z.string(), mass: z.number() })).default([]),
});

describe("encode-state — flat (params) mode", () => {
  it("round-trips primitive fields", () => {
    const sp = encodeState({ L: 2.5, theta: 0.4, mode: "small" }, flatSchema, "params");
    expect(sp.get("L")).toBe("2.5");
    expect(sp.get("theta")).toBe("0.4");
    expect(sp.get("mode")).toBe("small");
    const back = decodeState(new URLSearchParams(sp.toString()), flatSchema, "params");
    expect(back).toEqual({ L: 2.5, theta: 0.4, mode: "small" });
  });

  it("returns defaults when params are missing", () => {
    const back = decodeState(new URLSearchParams(""), flatSchema, "params");
    expect(back).toEqual({ L: 1.0, theta: 0.3, mode: "exact" });
  });

  it("falls back to defaults on malformed params", () => {
    const sp = new URLSearchParams("L=not-a-number&mode=invalid");
    const back = decodeState(sp, flatSchema, "params");
    expect(back).toEqual({ L: 1.0, theta: 0.3, mode: "exact" });
  });
});

describe("encode-state — blob mode", () => {
  it("round-trips a structured object via base64", () => {
    const state = {
      preset: "pythagorean",
      bodies: [{ id: "a", mass: 3 }, { id: "b", mass: 4 }],
    };
    const sp = encodeState(state, blobSchema, "blob");
    expect(sp.has("s")).toBe(true);
    const back = decodeState(new URLSearchParams(sp.toString()), blobSchema, "blob");
    expect(back).toEqual(state);
  });

  it("falls back to defaults on malformed base64", () => {
    const sp = new URLSearchParams("s=NOT_VALID_B64!!");
    const back = decodeState(sp, blobSchema, "blob");
    expect(back).toEqual({ preset: "figure-8", bodies: [] });
  });
});
