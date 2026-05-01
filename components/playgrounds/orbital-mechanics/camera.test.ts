import { describe, expect, it } from "vitest";
import {
  PX_PER_UNIT_DEFAULT,
  clampScale,
  defaultCamera,
  screenToWorld,
  worldToScreen,
  zoomTowardScreenPoint,
} from "./camera";

describe("camera", () => {
  it("default scale is the documented PX_PER_UNIT", () => {
    expect(defaultCamera().scale).toBe(PX_PER_UNIT_DEFAULT);
  });

  it("clamps zoom to [15, 400]", () => {
    expect(clampScale(0)).toBe(15);
    expect(clampScale(1e6)).toBe(400);
    expect(clampScale(80)).toBe(80);
  });

  it("screenToWorld and worldToScreen round-trip", () => {
    const cam = { scale: 100, panX: 1.5, panY: -2 };
    const w = 800;
    const h = 600;
    for (const [sx, sy] of [
      [0, 0],
      [400, 300],
      [123, 456],
    ]) {
      const wp = screenToWorld(cam, w, h, sx!, sy!);
      const sp = worldToScreen(cam, w, h, wp.x, wp.y);
      expect(sp.x).toBeCloseTo(sx!, 6);
      expect(sp.y).toBeCloseTo(sy!, 6);
    }
  });

  it("zoomTowardScreenPoint pins the world point under the cursor", () => {
    const cam = { scale: 80, panX: 0, panY: 0 };
    const w = 800;
    const h = 600;
    const anchor = { sx: 200, sy: 150 };
    const before = screenToWorld(cam, w, h, anchor.sx, anchor.sy);
    zoomTowardScreenPoint(cam, w, h, anchor.sx, anchor.sy, 1.5);
    const after = screenToWorld(cam, w, h, anchor.sx, anchor.sy);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
    expect(cam.scale).toBeCloseTo(120, 6);
  });

  it("zoomTowardScreenPoint respects the scale clamp", () => {
    const cam = { scale: 80, panX: 0, panY: 0 };
    zoomTowardScreenPoint(cam, 800, 600, 400, 300, 1e6);
    expect(cam.scale).toBe(400);
  });
});
