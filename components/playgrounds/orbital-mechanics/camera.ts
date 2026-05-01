export interface Camera {
  scale: number;
  panX: number;
  panY: number;
}

export const PX_PER_UNIT_DEFAULT = 80;
export const MIN_SCALE = 15;
export const MAX_SCALE = 400;

export function defaultCamera(): Camera {
  return { scale: PX_PER_UNIT_DEFAULT, panX: 0, panY: 0 };
}

export function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

export function screenToWorld(
  cam: Camera,
  width: number,
  height: number,
  sx: number,
  sy: number,
): { x: number; y: number } {
  return {
    x: (sx - width / 2) / cam.scale + cam.panX,
    y: (sy - height / 2) / cam.scale + cam.panY,
  };
}

export function worldToScreen(
  cam: Camera,
  width: number,
  height: number,
  wx: number,
  wy: number,
): { x: number; y: number } {
  return {
    x: width / 2 + (wx - cam.panX) * cam.scale,
    y: height / 2 + (wy - cam.panY) * cam.scale,
  };
}

/**
 * Wheel-zoom toward a screen anchor: the world point under (sx, sy) stays
 * pinned while the scale changes by `factor`. Mutates `cam` in place.
 */
export function zoomTowardScreenPoint(
  cam: Camera,
  width: number,
  height: number,
  sx: number,
  sy: number,
  factor: number,
): void {
  const before = screenToWorld(cam, width, height, sx, sy);
  cam.scale = clampScale(cam.scale * factor);
  const after = screenToWorld(cam, width, height, sx, sy);
  cam.panX += before.x - after.x;
  cam.panY += before.y - after.y;
}
