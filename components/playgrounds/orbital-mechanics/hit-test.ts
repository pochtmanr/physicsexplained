import { bodyRadius, type Body } from "@/lib/physics/n-body";
import { worldToScreen, type Camera } from "./camera";
import { BODY_HIT_RADIUS_PX } from "./gestures";

export const HIT_RADIUS_SLOP_PX = 6;
export const MIN_VISIBLE_RADIUS_PX = 2;

/**
 * Body radius in screen pixels at the current zoom, with a floor so deep
 * zoom-out still leaves something to click on.
 */
export function visibleRadiusPx(mass: number, scale: number): number {
  return Math.max(MIN_VISIBLE_RADIUS_PX, bodyRadius(mass) * scale);
}

/**
 * Index of the body under (sx, sy) in canvas pixels, or -1 for empty space.
 * Honors a generous click-target slop so small bodies stay tappable.
 */
export function hitTest(
  bodies: Body[],
  cam: Camera,
  width: number,
  height: number,
  sx: number,
  sy: number,
): number {
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]!;
    const p = worldToScreen(cam, width, height, b.x, b.y);
    const r = Math.max(
      BODY_HIT_RADIUS_PX,
      visibleRadiusPx(b.mass, cam.scale) + HIT_RADIUS_SLOP_PX,
    );
    if (Math.hypot(p.x - sx, p.y - sy) <= r) return i;
  }
  return -1;
}
