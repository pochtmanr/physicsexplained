import { describe, it, expect } from "vitest";
import { acquireStreamSlot } from "@/lib/ask/stream-lock";

describe("acquireStreamSlot", () => {
  it("gives the slot to one caller and refuses a parallel one", async () => {
    const release = await acquireStreamSlot("u-parallel", 0);
    expect(release).toBeTypeOf("function");
    expect(await acquireStreamSlot("u-parallel", 0)).toBeNull();
    release!();
    const again = await acquireStreamSlot("u-parallel", 0);
    expect(again).toBeTypeOf("function");
    again!();
  });

  it("lets only one of a burst through", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => acquireStreamSlot("u-burst", 0)));
    expect(results.filter(Boolean)).toHaveLength(1);
    results.find(Boolean)!();
  });

  it("waits for a stream that is just finishing", async () => {
    const release = await acquireStreamSlot("u-wait", 0);
    setTimeout(() => release!(), 150);
    const next = await acquireStreamSlot("u-wait", 1000);
    expect(next).toBeTypeOf("function");
    next!();
  });

  it("keeps users independent", async () => {
    const a = await acquireStreamSlot("u-a", 0);
    const b = await acquireStreamSlot("u-b", 0);
    expect(a && b).toBeTruthy();
    a!(); b!();
  });
});
