import type {
  RayTraceScene,
  SceneElement,
  TraceResult,
  TracedRay,
  Vec2,
  Interface,
  Mirror,
  ThinLens,
  RaySource,
  Screen,
} from "./types";

function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y; }
function len(a: Vec2): number { return Math.sqrt(dot(a, a)); }
function normalize(a: Vec2): Vec2 { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; }
function sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(a: Vec2, s: number): Vec2 { return { x: a.x * s, y: a.y * s }; }

/**
 * Snell's law. `normal` is the geometric surface normal (either side);
 * `n1` is the index of the medium the ray is coming FROM, `n2` is the
 * medium it is going INTO. Orientation is auto-detected so the caller
 * doesn't have to flip the normal — we flip internally if needed so that
 * the normal used in the math points against the incoming ray direction.
 * Returns null if total internal reflection occurs.
 */
export function refract(direction: Vec2, normal: Vec2, n1: number, n2: number): Vec2 | null {
  const n = normalize(normal);
  const d = normalize(direction);
  let cosI = -dot(d, n);
  let normUsed = n;
  if (cosI < 0) { // normal points along the ray direction — flip it to face the incoming ray
    cosI = -cosI;
    normUsed = scale(n, -1);
  }
  const eta = n1 / n2;
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T > 1) return null; // TIR
  const cosT = Math.sqrt(1 - sin2T);
  return normalize(add(scale(d, eta), scale(normUsed, eta * cosI - cosT)));
}

/** Returns reflection vector r = d − 2(d·n)n (n need not be unit). */
export function reflect(direction: Vec2, normal: Vec2): Vec2 {
  const n = normalize(normal);
  const d = normalize(direction);
  return normalize(sub(d, scale(n, 2 * dot(d, n))));
}

/** Critical angle for TIR from medium n1 into n2 (n1 > n2). Returns null otherwise. */
export function criticalAngle(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

/**
 * Fresnel amplitude coefficients for s-polarization (perp) and p-polarization (parallel).
 * thetaI is incidence angle in radians.
 */
export function fresnelCoefficients(thetaI: number, n1: number, n2: number) {
  const sinT = (n1 / n2) * Math.sin(thetaI);
  if (Math.abs(sinT) > 1) {
    return { rs: -1, rp: -1, ts: 0, tp: 0 }; // TIR
  }
  const thetaT = Math.asin(sinT);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n1 * cosT - n2 * cosI) / (n1 * cosT + n2 * cosI);
  const ts = (2 * n1 * cosI) / (n1 * cosI + n2 * cosT);
  const tp = (2 * n1 * cosI) / (n2 * cosI + n1 * cosT);
  return { rs, rp, ts, tp };
}

/** Thin-lens equation: 1/f = 1/s_o + 1/s_i. Returns image distance and magnification. */
export function thinLensImage(focalLength: number, objectDistance: number): { imageDistance: number; magnification: number } {
  const imageDistance = 1 / (1 / focalLength - 1 / objectDistance);
  const magnification = -imageDistance / objectDistance;
  return { imageDistance, magnification };
}

/**
 * Huygens–Fresnel summation for a 1D far-field diffraction pattern.
 * Inputs in consistent length units (mm suggested).
 */
export function huygensSum(params: {
  slitPositions: number[];       // position along the aperture plane
  slitWidth: number;
  wavelengthMm: number;
  distanceToScreen: number;
  screenHalfWidth: number;
  bins: number;
}): number[] {
  const { slitPositions, slitWidth, wavelengthMm, distanceToScreen, screenHalfWidth, bins } = params;
  const intensity = new Array<number>(bins).fill(0);
  const k = (2 * Math.PI) / wavelengthMm;
  const subSourcesPerSlit = 64;
  const dx = slitWidth / subSourcesPerSlit;
  for (let b = 0; b < bins; b += 1) {
    const yScreen = -screenHalfWidth + (b / (bins - 1)) * 2 * screenHalfWidth;
    let re = 0;
    let im = 0;
    for (const slitCentre of slitPositions) {
      for (let s = 0; s < subSourcesPerSlit; s += 1) {
        const yS = slitCentre - slitWidth / 2 + (s + 0.5) * dx;
        const r = Math.sqrt(distanceToScreen * distanceToScreen + (yScreen - yS) * (yScreen - yS));
        const phase = k * r;
        re += Math.cos(phase) / Math.sqrt(r);
        im += Math.sin(phase) / Math.sqrt(r);
      }
    }
    intensity[b] = re * re + im * im;
  }
  // normalise to unit max
  const maxI = Math.max(...intensity) || 1;
  for (let i = 0; i < bins; i += 1) intensity[i] /= maxI;
  return intensity;
}

/**
 * Trace every RaySource through the scene until each ray terminates.
 * Interfaces refract + optionally reflect (weighted by Fresnel if caller wants).
 * Mirrors reflect. Lenses refract via thin-lens formula. Slits emit HuygensWavelet (deferred to huygensSum).
 * Screens absorb.
 * This is an analytical, bounce-counting engine — NOT a Maxwell-FDTD solver.
 */
export function trace(scene: RayTraceScene): TraceResult {
  const rays: TracedRay[] = [];
  const screens = scene.elements.filter((e): e is Screen => e.kind === "screen");
  const screenIntensities = new Map<string, number[]>();
  for (const sc of screens) {
    screenIntensities.set(sc.id, new Array<number>(sc.intensityBins ?? 256).fill(0));
  }
  const sources = scene.elements.filter((e): e is RaySource => e.kind === "ray-source");
  for (const src of sources) {
    const fanCount = src.fanCount ?? 1;
    const halfAngle = src.fanHalfAngleDeg ?? 0;
    for (let i = 0; i < fanCount; i += 1) {
      const t = fanCount === 1 ? 0 : (i / (fanCount - 1)) * 2 - 1;
      const angleDeg = src.directionDeg + t * halfAngle;
      const rad = (angleDeg * Math.PI) / 180;
      const direction = { x: Math.cos(rad), y: Math.sin(rad) };
      const traced = traceSingleRay(scene, src.position, direction, src.wavelengthNm, scene.maxBounces ?? 32);
      traced.sourceId = src.id;
      rays.push(traced);
    }
  }
  return { rays, screenIntensities };
}

function traceSingleRay(
  scene: RayTraceScene,
  origin: Vec2,
  direction: Vec2,
  wavelengthNm: number | undefined,
  maxBounces: number,
): TracedRay {
  const segments: TracedRay["segments"] = [];
  let cur = { x: origin.x, y: origin.y };
  let dir = normalize(direction);
  let bounces = 0;
  while (bounces < maxBounces) {
    const hit = nearestHit(scene, cur, dir);
    if (!hit) {
      segments.push({ from: cur, to: { x: cur.x + dir.x * 10000, y: cur.y + dir.y * 10000 }, amplitude: 1, wavelengthNm });
      return { id: `ray-${bounces}`, sourceId: "", segments, terminated: "escaped" };
    }
    segments.push({ from: cur, to: hit.point, amplitude: 1, wavelengthNm });
    if (hit.element.kind === "screen") {
      return { id: `ray-${bounces}`, sourceId: "", segments, terminated: "screen-hit", terminalPoint: hit.point };
    }
    if (hit.element.kind === "interface") {
      const n1 = hit.fromSide === "p1" ? hit.element.n1 : hit.element.n2;
      const n2 = hit.fromSide === "p1" ? hit.element.n2 : hit.element.n1;
      const refracted = refract(dir, hit.normal, n1, n2);
      if (!refracted) {
        dir = reflect(dir, hit.normal); // TIR
      } else {
        dir = refracted;
      }
    } else if (hit.element.kind === "mirror") {
      dir = reflect(dir, hit.normal);
    } else if (hit.element.kind === "thin-lens") {
      dir = refractThinLens(hit.element, cur, dir);
    }
    cur = { x: hit.point.x + dir.x * 0.001, y: hit.point.y + dir.y * 0.001 };
    bounces += 1;
  }
  return { id: `ray-maxbounces`, sourceId: "", segments, terminated: "max-bounces" };
}

interface Hit {
  element: SceneElement;
  point: Vec2;
  normal: Vec2;
  distance: number;
  fromSide: "p1" | "p2"; // which side the ray came from — for interface n1/n2 swap
}

function nearestHit(scene: RayTraceScene, origin: Vec2, dir: Vec2): Hit | null {
  let nearest: Hit | null = null;
  for (const el of scene.elements) {
    let hit: Hit | null = null;
    if (el.kind === "interface") hit = hitInterface(el, origin, dir);
    else if (el.kind === "mirror") hit = hitMirror(el, origin, dir);
    else if (el.kind === "thin-lens") hit = hitThinLens(el, origin, dir);
    else if (el.kind === "screen") hit = hitScreen(el, origin, dir);
    if (hit && (!nearest || hit.distance < nearest.distance)) nearest = hit;
  }
  return nearest;
}

function hitInterface(el: Interface, origin: Vec2, dir: Vec2): Hit | null {
  // parameterise segment p1 + t(p2-p1) and ray origin + s*dir, solve 2x2
  const vx = el.p2.x - el.p1.x;
  const vy = el.p2.y - el.p1.y;
  const denom = dir.x * (-vy) - dir.y * (-vx);
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((el.p1.x - origin.x) * (-vy) - (el.p1.y - origin.y) * (-vx)) / denom;
  const u = ((el.p1.x - origin.x) * dir.y - (el.p1.y - origin.y) * dir.x) / -denom;
  if (t < 1e-6 || u < 0 || u > 1) return null;
  const point = { x: origin.x + t * dir.x, y: origin.y + t * dir.y };
  const normal = normalize({ x: -vy, y: vx }); // 90° rotation of interface tangent
  const fromSide = dot(sub(origin, el.p1), normal) > 0 ? "p1" as const : "p2" as const;
  return { element: el, point, normal, distance: t, fromSide };
}

function hitMirror(_el: Mirror, _origin: Vec2, _dir: Vec2): Hit | null {
  return null; // not needed for any §09 topic in Session 5 beyond flat-mirror case handled via Interface with reflective:true
}

function hitThinLens(el: ThinLens, origin: Vec2, dir: Vec2): Hit | null {
  // treat lens as an infinitely-thin segment centered on el.center, extending perpendicular to el.axis
  const perp = { x: -el.axis.y, y: el.axis.x };
  const p1 = { x: el.center.x - perp.x * el.apertureHalfWidth, y: el.center.y - perp.y * el.apertureHalfWidth };
  const p2 = { x: el.center.x + perp.x * el.apertureHalfWidth, y: el.center.y + perp.y * el.apertureHalfWidth };
  const pseudo: Interface = { kind: "interface", id: el.id, p1, p2, n1: 1, n2: 1 };
  return hitInterface(pseudo, origin, dir);
}

function hitScreen(el: Screen, origin: Vec2, dir: Vec2): Hit | null {
  const perp = { x: -el.axis.y, y: el.axis.x };
  const p1 = { x: el.center.x - perp.x * el.halfWidth, y: el.center.y - perp.y * el.halfWidth };
  const p2 = { x: el.center.x + perp.x * el.halfWidth, y: el.center.y + perp.y * el.halfWidth };
  const pseudo: Interface = { kind: "interface", id: el.id, p1, p2, n1: 1, n2: 1 };
  return hitInterface(pseudo, origin, dir);
}

function refractThinLens(el: ThinLens, origin: Vec2, dir: Vec2): Vec2 {
  // Approximate: for a ray hitting the lens at displacement h from the axis,
  // the output direction is such that it focuses at distance f on the axis.
  const axis = normalize(el.axis);
  const perp = { x: -axis.y, y: axis.x };
  // distance along perp from axis to where ray hits (assume ray is at lens position)
  const rel = sub(origin, el.center);
  const h = dot(rel, perp);
  // exit angle: tan(theta_out) = tan(theta_in) - h / f (paraxial thin-lens)
  const inAngle = Math.atan2(dot(dir, perp), dot(dir, axis));
  const outAngle = inAngle - h / el.focalLength;
  return normalize(add(scale(axis, Math.cos(outAngle)), scale(perp, Math.sin(outAngle))));
}
