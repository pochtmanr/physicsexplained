import type { Body } from "@/lib/physics/n-body";

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

/** Per-body ring of timestamped positions, indexed by body id. */
export type TrailBuffers = Map<string, TrailPoint[]>;

export const TRAIL_MAX_AGE_S = 6;

export function createTrailBuffers(): TrailBuffers {
  return new Map();
}

/**
 * Push the latest body positions into the trail map, age the existing
 * entries, and drop anything older than `maxAge` seconds.
 *
 * Mutates `trails` in place — same Map identity stays stable so callers can
 * hold a ref to it without re-binding.
 */
export function appendTrails(
  trails: TrailBuffers,
  bodies: Body[],
  dt: number,
  maxAge: number = TRAIL_MAX_AGE_S,
): void {
  for (const b of bodies) {
    const buf = trails.get(b.id) ?? [];
    for (const p of buf) p.age += dt;
    while (buf.length > 0 && buf[0]!.age > maxAge) buf.shift();
    buf.push({ x: b.x, y: b.y, age: 0 });
    trails.set(b.id, buf);
  }
}

/**
 * Drop trail entries for any id that no longer corresponds to a live body.
 * Call after place/remove/merge so orphan trails don't stick around for the
 * next paint.
 */
export function pruneOrphans(
  trails: TrailBuffers,
  liveIds: ReadonlySet<string>,
): void {
  for (const id of [...trails.keys()]) {
    if (!liveIds.has(id)) trails.delete(id);
  }
}

export function clearTrails(trails: TrailBuffers): void {
  trails.clear();
}
