"use client";

import { useEffect, useRef, useState } from "react";

/** A point on the manifold parametrised by (u, v) coordinates. */
export interface ManifoldChartPoint {
  u: number;
  v: number;
}

/** Embedding function (u, v) -> (x, y, z) in ambient ℝ³. The component projects to 2D
 *  using a fixed isometric-style projection (rotation around world-Y, drop world-Z). */
export type ManifoldEmbedding = (u: number, v: number) => readonly [number, number, number];

/** A small tangent-vector arrow drawn at a point on the manifold. */
export interface TangentArrow {
  base: ManifoldChartPoint;
  /** Tangent vector in chart coordinates (du, dv). The component multiplies by the
   *  pushforward Jacobian J = (∂_u embedding, ∂_v embedding) to get the ambient direction. */
  vector: readonly [number, number];
  color?: string;
  label?: string;
}

/** A parallel-transport path: a curve in (u, v) chart coords with tangent-vector arrows
 *  drawn at successive points showing how the vector rotates as you transport. */
export interface ParallelTransportPath {
  /** Sample points along the curve in (u, v) chart coords. */
  curve: readonly ManifoldChartPoint[];
  /** Initial tangent vector at curve[0] in chart coords. */
  initialVector: readonly [number, number];
  /** Tangent vectors at every curve sample (computed by caller using the connection
   *  on the manifold). The component just renders them — it does not solve the parallel-
   *  transport equation. */
  transportedVectors: readonly (readonly [number, number])[];
  color?: string;
  label?: string;
}

export interface ManifoldCanvasProps {
  /** Embedding (u, v) → (x, y, z). For a sphere of radius R: (R cos v sin u, R sin v sin u, R cos u). */
  embedding: ManifoldEmbedding;
  /** Chart parameter range. Default: u ∈ [0, π], v ∈ [0, 2π] (sphere). */
  uRange?: [number, number];
  vRange?: [number, number];
  /** Number of grid lines per direction. Default: 16 × 24. */
  uSteps?: number;
  vSteps?: number;
  /** Optional tangent-vector arrows at fixed points. */
  tangentArrows?: readonly TangentArrow[];
  /** Optional parallel-transport overlay (e.g. spherical-triangle holonomy reveal). */
  parallelTransport?: ParallelTransportPath | null;
  /** Optional geodesic curve as an array of (u, v) chart points — drawn as a thick line
   *  on top of the grid. */
  geodesic?: readonly ManifoldChartPoint[];
  /** Rotation angle around the world-Y axis (radians). Default 0.7. */
  rotationY?: number;
  rotationMin?: number;
  rotationMax?: number;
  rotationStep?: number;
  onRotationChange?: (theta: number) => void;
  /** Canvas dimensions (CSS px). */
  width?: number;
  height?: number;
  /** Optional palette override. */
  palette?: Partial<ManifoldPalette>;
}

interface ManifoldPalette {
  surface: string; // grid-line color
  highlight: string; // tangent-arrow / geodesic color
  transport: string; // parallel-transport overlay color
  background: string; // canvas background (CSS color)
  axes: string;
}

const DEFAULT_PALETTE: ManifoldPalette = {
  surface: "rgba(255,255,255,0.18)",
  highlight: "#67E8F9",
  transport: "#FF6ADE",
  background: "#0A0C12",
  axes: "rgba(255,255,255,0.5)",
};

type Vec3 = readonly [number, number, number];

/** Rotate (x, y, z) around the world-Y axis by theta radians. */
function rotateY(p: Vec3, theta: number): Vec3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const [x, y, z] = p;
  return [c * x + s * z, y, -s * x + c * z];
}

export function ManifoldCanvas({
  embedding,
  uRange = [0, Math.PI],
  vRange = [0, 2 * Math.PI],
  uSteps = 16,
  vSteps = 24,
  tangentArrows,
  parallelTransport = null,
  geodesic,
  rotationY: rotationYProp,
  rotationMin = -Math.PI,
  rotationMax = Math.PI,
  rotationStep = 0.02,
  onRotationChange,
  width = 480,
  height = 360,
  palette,
}: ManifoldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = { ...DEFAULT_PALETTE, ...palette };
  const [internalTheta, setInternalTheta] = useState(rotationYProp ?? 0.7);
  const theta =
    onRotationChange !== undefined ? (rotationYProp ?? 0.7) : internalTheta;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const [uMin, uMax] = uRange;
    const [vMin, vMax] = vRange;
    const margin = 24;

    // Sample the embedded surface, rotate, and compute centroid + scale.
    const denseUSteps = Math.max(uSteps, 24);
    const denseVSteps = Math.max(vSteps, 32);
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i <= denseUSteps; i++) {
      const u = uMin + ((uMax - uMin) * i) / denseUSteps;
      for (let j = 0; j <= denseVSteps; j++) {
        const v = vMin + ((vMax - vMin) * j) / denseVSteps;
        const p = rotateY(embedding(u, v), theta);
        sumX += p[0];
        sumY += p[1];
        count++;
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
    }
    const centerX = count > 0 ? sumX / count : 0;
    const centerY = count > 0 ? sumY / count : 0;
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;
    const worldScale = Math.min(plotW / spanX, plotH / spanY);

    /** Project rotated world-space (x, y, z) to canvas pixels. */
    const projectRotated = (p: Vec3): [number, number] => {
      const px = width / 2 + (p[0] - centerX) * worldScale;
      const py = height / 2 - (p[1] - centerY) * worldScale;
      return [px, py];
    };

    // Helper to draw a polyline with a per-segment hidden-surface heuristic.
    const drawIsoLine = (samples: Vec3[], baseStrokeFront: string, baseStrokeBack: string, lineWidth: number) => {
      // Rotate once.
      const rotated = samples.map((p) => rotateY(p, theta));
      for (let i = 1; i < rotated.length; i++) {
        const a = rotated[i - 1];
        const b = rotated[i];
        const midZ = (a[2] + b[2]) / 2;
        ctx.strokeStyle = midZ >= 0 ? baseStrokeFront : baseStrokeBack;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = midZ >= 0 ? 1 : 0.25;
        ctx.beginPath();
        const [ax, ay] = projectRotated(a);
        const [bx, by] = projectRotated(b);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    // Front/back versions of grid color (back at 0.25× alpha is handled via globalAlpha).
    const baseSurface = colors.surface;
    const heavySurface = colors.surface.replace(
      /rgba\(([^)]+)\)/,
      (_match, inner: string) => {
        const parts = inner.split(",").map((s) => s.trim());
        if (parts.length === 4) {
          const a = parseFloat(parts[3]);
          const boosted = Math.min(1, a + 0.1);
          return `rgba(${parts[0]},${parts[1]},${parts[2]},${boosted.toFixed(3)})`;
        }
        return `rgba(255,255,255,0.28)`;
      },
    );

    // u-iso lines (vary v at fixed u).
    for (let i = 0; i <= uSteps; i++) {
      const u = uMin + ((uMax - uMin) * i) / uSteps;
      const samples: Vec3[] = [];
      for (let j = 0; j <= vSteps * 2; j++) {
        const v = vMin + ((vMax - vMin) * j) / (vSteps * 2);
        samples.push(embedding(u, v));
      }
      const isHeavy = i % 4 === 0;
      const stroke = isHeavy ? heavySurface : baseSurface;
      drawIsoLine(samples, stroke, stroke, isHeavy ? 1.25 : 1);
    }

    // v-iso lines (vary u at fixed v).
    for (let j = 0; j <= vSteps; j++) {
      const v = vMin + ((vMax - vMin) * j) / vSteps;
      const samples: Vec3[] = [];
      for (let i = 0; i <= uSteps * 2; i++) {
        const u = uMin + ((uMax - uMin) * i) / (uSteps * 2);
        samples.push(embedding(u, v));
      }
      const isHeavy = j % 4 === 0;
      const stroke = isHeavy ? heavySurface : baseSurface;
      drawIsoLine(samples, stroke, stroke, isHeavy ? 1.25 : 1);
    }

    // Numerical pushforward of a chart-coords vector (du, dv) at base (u, v).
    const pushforward = (
      u: number,
      v: number,
      du: number,
      dv: number,
    ): Vec3 => {
      const eps = 1e-3;
      const p0 = embedding(u, v);
      const pu = embedding(u + eps, v);
      const pv = embedding(u, v + eps);
      const dEu: Vec3 = [(pu[0] - p0[0]) / eps, (pu[1] - p0[1]) / eps, (pu[2] - p0[2]) / eps];
      const dEv: Vec3 = [(pv[0] - p0[0]) / eps, (pv[1] - p0[1]) / eps, (pv[2] - p0[2]) / eps];
      return [
        dEu[0] * du + dEv[0] * dv,
        dEu[1] * du + dEv[1] * dv,
        dEu[2] * du + dEv[2] * dv,
      ];
    };

    /** Draw a single arrow from (u, v) with chart-coord vector (du, dv). */
    const drawArrow = (
      u: number,
      v: number,
      du: number,
      dv: number,
      strokeColor: string,
      label?: string,
    ) => {
      const baseEmbed = embedding(u, v);
      const dirAmbient = pushforward(u, v, du, dv);
      const baseRot = rotateY(baseEmbed, theta);
      const tipEmbed: Vec3 = [
        baseEmbed[0] + dirAmbient[0],
        baseEmbed[1] + dirAmbient[1],
        baseEmbed[2] + dirAmbient[2],
      ];
      const tipRot = rotateY(tipEmbed, theta);

      // Project base and the rotated direction.
      const [bx, by] = projectRotated(baseRot);
      const dxRot = tipRot[0] - baseRot[0];
      const dyRot = tipRot[1] - baseRot[1];
      const len2D = Math.hypot(dxRot, dyRot);
      if (len2D < 1e-9) return;
      // Arrow length in world units = 0.18 * (typical span). worldScale converts to px.
      const arrowLenWorld = 0.18 * Math.max(spanX, spanY) * 0.5;
      const sx = (dxRot / len2D) * arrowLenWorld;
      const sy = (dyRot / len2D) * arrowLenWorld;

      const tipScreenX = bx + sx * worldScale;
      const tipScreenY = by - sy * worldScale;

      // Hidden-surface alpha for the arrow base.
      const isFront = baseRot[2] >= 0;
      ctx.globalAlpha = isFront ? 1 : 0.4;

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tipScreenX, tipScreenY);
      ctx.stroke();

      // Arrowhead (small triangle).
      const ang = Math.atan2(tipScreenY - by, tipScreenX - bx);
      const headLen = 7;
      const headAng = 0.5;
      ctx.beginPath();
      ctx.moveTo(tipScreenX, tipScreenY);
      ctx.lineTo(
        tipScreenX - headLen * Math.cos(ang - headAng),
        tipScreenY - headLen * Math.sin(ang - headAng),
      );
      ctx.lineTo(
        tipScreenX - headLen * Math.cos(ang + headAng),
        tipScreenY - headLen * Math.sin(ang + headAng),
      );
      ctx.closePath();
      ctx.fill();

      if (label) {
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(label, tipScreenX + 6, tipScreenY);
      }

      ctx.globalAlpha = 1;
    };

    // Geodesic overlay
    if (geodesic && geodesic.length > 1) {
      ctx.strokeStyle = colors.highlight;
      ctx.lineWidth = 2.5;
      // Draw segment-by-segment with hidden-surface heuristic.
      const samples3D: Vec3[] = geodesic.map((p) => embedding(p.u, p.v));
      const rotated = samples3D.map((p) => rotateY(p, theta));
      for (let i = 1; i < rotated.length; i++) {
        const a = rotated[i - 1];
        const b = rotated[i];
        const midZ = (a[2] + b[2]) / 2;
        ctx.globalAlpha = midZ >= 0 ? 1 : 0.35;
        ctx.beginPath();
        const [ax, ay] = projectRotated(a);
        const [bx, by] = projectRotated(b);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Parallel-transport overlay
    if (parallelTransport && parallelTransport.curve.length > 0) {
      const transportColor = parallelTransport.color ?? colors.transport;
      // Curve polyline.
      const samples3D: Vec3[] = parallelTransport.curve.map((p) => embedding(p.u, p.v));
      const rotated = samples3D.map((p) => rotateY(p, theta));
      ctx.strokeStyle = transportColor;
      ctx.lineWidth = 2;
      for (let i = 1; i < rotated.length; i++) {
        const a = rotated[i - 1];
        const b = rotated[i];
        const midZ = (a[2] + b[2]) / 2;
        ctx.globalAlpha = midZ >= 0 ? 1 : 0.35;
        ctx.beginPath();
        const [ax, ay] = projectRotated(a);
        const [bx, by] = projectRotated(b);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Per-sample tangent arrows.
      const vectors = parallelTransport.transportedVectors;
      for (let i = 0; i < parallelTransport.curve.length; i++) {
        const pt = parallelTransport.curve[i];
        const vec = vectors[i] ?? parallelTransport.initialVector;
        drawArrow(pt.u, pt.v, vec[0], vec[1], transportColor, i === 0 ? parallelTransport.label : undefined);
      }
    }

    // Static tangent arrows
    if (tangentArrows) {
      for (const arrow of tangentArrows) {
        drawArrow(
          arrow.base.u,
          arrow.base.v,
          arrow.vector[0],
          arrow.vector[1],
          arrow.color ?? colors.highlight,
          arrow.label,
        );
      }
    }
  }, [
    embedding,
    uRange,
    vRange,
    uSteps,
    vSteps,
    tangentArrows,
    parallelTransport,
    geodesic,
    theta,
    width,
    height,
    colors,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      {onRotationChange !== undefined ? (
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span>θ = {theta.toFixed(2)} rad</span>
          <input
            type="range"
            min={rotationMin}
            max={rotationMax}
            step={rotationStep}
            value={theta}
            onChange={(e) => onRotationChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      ) : null}
    </div>
  );
}
