/**
 * RayTraceCanvas — canonical type definitions.
 *
 * §09 topic agents (and §08 plane-wave scenes) MUST import from this file.
 * No local copies, no fallbacks. If a new field or kind is required, extend
 * this file via the orchestrator, not in the topic agent.
 */

/** 2D point in canvas coordinates. Canvas origin is top-left; tracer Y-axis flipped for physics convention. */
export interface Vec2 {
  x: number;
  y: number;
}

/** A ray is a directed line from (x,y) with direction vector (dx,dy) (unit). Wavelength in nm, optional polarisation unit vector perpendicular to direction. */
export interface Ray {
  id: string;
  origin: Vec2;
  direction: Vec2;
  wavelengthNm?: number; // 380–780 for visible; arbitrary for radio/microwave etc.
  polarization?: Vec2;   // perpendicular to direction in the xy plane — null means unpolarised
  amplitude?: number;    // relative intensity 0..1
  colorHint?: string;    // optional override; if absent, derived from wavelength
}

/** A planar interface between two homogeneous dielectric media, finite width, infinite in the out-of-plane direction. */
export interface Interface {
  kind: "interface";
  id: string;
  p1: Vec2;         // interface endpoints
  p2: Vec2;
  n1: number;       // index of refraction on the side the ray comes from (determined by normal direction)
  n2: number;       // index on the other side
  reflective?: boolean; // true → pure mirror (glass-air handled as interface with TIR via tracer)
}

/** Spherical mirror — curvature > 0 concave, < 0 convex, 0 flat. */
export interface Mirror {
  kind: "mirror";
  id: string;
  center: Vec2;         // geometric centre of the arc
  radius: number;       // radius of curvature — Infinity for flat mirror
  apertureHalfAngleDeg: number; // how much of the sphere is present
  axis: Vec2;           // unit vector pointing outward from reflective side
}

/** Thin lens — modeled via lens-maker's equation (1/f = (n − 1)(1/R1 − 1/R2 + …)); thin-lens approximation. */
export interface ThinLens {
  kind: "thin-lens";
  id: string;
  center: Vec2;
  axis: Vec2;           // optical axis (unit vector)
  focalLength: number;  // +converging, −diverging
  apertureHalfWidth: number;
}

/** Ray source — emits one or more rays. */
export interface RaySource {
  kind: "ray-source";
  id: string;
  position: Vec2;
  directionDeg: number;           // base direction in degrees from +x axis
  fanHalfAngleDeg?: number;       // 0 for single ray; >0 for a fan of rays
  fanCount?: number;              // number of rays in the fan
  wavelengthNm?: number;
  polarizationDeg?: number | null; // angle in degrees from direction's perpendicular; null = unpolarised
}

/** Aperture — blocks all rays except where it has an opening. Simple rectangular slit or circular iris. */
export interface Aperture {
  kind: "aperture";
  id: string;
  center: Vec2;
  axis: Vec2;                     // normal to the aperture plane
  halfWidth: number;              // total aperture width / 2
  openings: { offset: number; halfWidth: number }[]; // positions along the aperture plane
}

/** Slit configuration for diffraction — double-slit with adjustable d and width. */
export interface Slit {
  kind: "slit";
  id: string;
  center: Vec2;
  axis: Vec2;
  slitWidth: number;       // width of each slit (a)
  slitSeparation: number;  // centre-to-centre spacing (d); use 0 for single-slit
  slitCount: number;       // 1 or 2 (extensible to N)
}

/** Screen — detector / intensity readout. Rays hitting the screen register intensity as a function of position. */
export interface Screen {
  kind: "screen";
  id: string;
  center: Vec2;
  axis: Vec2;            // normal to the screen surface
  halfWidth: number;
  intensityBins?: number; // how many bins to discretise the screen into for Huygens-sum rendering
}

/** A coherent wavelet source for Huygens sum — enabled when a slit is upstream of a screen. */
export interface HuygensWavelet {
  kind: "huygens-wavelet";
  id: string;
  origin: Vec2;
  wavelengthNm: number;
  phaseRad: number;
  amplitude: number;
}

/** A waveguide mode region — a tube-of-material extension for §09.10 fiber optics. Extension hook; tracer treats as straight propagation with periodic TIR bounce. */
export interface WaveguideMode {
  kind: "waveguide-mode";
  id: string;
  p1: Vec2;             // start of the waveguide centreline
  p2: Vec2;             // end
  halfWidth: number;
  coreIndex: number;
  claddingIndex: number;
  modeIndex?: number;    // TE_m mode index
}

/** Discriminated union of all scene elements the tracer and renderer handle. */
export type SceneElement =
  | Interface
  | Mirror
  | ThinLens
  | RaySource
  | Aperture
  | Slit
  | Screen
  | HuygensWavelet
  | WaveguideMode;

/** A single RayTraceCanvas scene. */
export interface RayTraceScene {
  width: number;
  height: number;
  elements: SceneElement[];
  /** Optional: override the default dark background. */
  background?: string;
  /** Enable Huygens-sum intensity overlay on Screens that have slits upstream. */
  enableHuygensSum?: boolean;
  /** Max ray bounces before tracer gives up (default 32). */
  maxBounces?: number;
}

/** Tracer output — one path per original ray, possibly forking at interfaces. */
export interface TracedRay {
  id: string;
  sourceId: string;
  segments: { from: Vec2; to: Vec2; amplitude: number; wavelengthNm?: number }[];
  terminated: "screen-hit" | "absorbed" | "escaped" | "max-bounces";
  terminalPoint?: Vec2;
}

/** Aggregated tracer output for a full scene trace. */
export interface TraceResult {
  rays: TracedRay[];
  screenIntensities: Map<string, number[]>; // per-Screen intensity array, indexed by intensityBins
}
