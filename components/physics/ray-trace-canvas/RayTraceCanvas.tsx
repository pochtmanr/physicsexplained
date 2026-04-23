"use client";
import { useEffect, useRef } from "react";
import type { RayTraceScene, SceneElement } from "./types";
import { trace } from "./tracer";

export interface RayTraceCanvasProps {
  scene: RayTraceScene;
  className?: string;
  /** Show intensity overlay on screens with diffraction/interference. */
  showIntensity?: boolean;
  /** Optional HUD — key/value pairs to overlay in the top-left. */
  hud?: Record<string, string | number>;
}

const BG = "#0b0d10";
const RAY_COLOR = "rgba(255,180,80,0.9)";
const INTERFACE_COLOR = "rgba(120,220,240,0.8)";
const LENS_COLOR = "rgba(200,160,255,0.9)";
const SCREEN_COLOR = "rgba(200,200,210,0.8)";
const SLIT_COLOR = "rgba(230,100,200,0.9)";
const HUD_COLOR = "rgba(200,200,200,0.7)";

export function RayTraceCanvas({ scene, className, showIntensity, hud }: RayTraceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = scene;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = scene.background ?? BG;
    ctx.fillRect(0, 0, width, height);

    // trace rays
    const result = trace(scene);

    // draw static scene elements first
    for (const el of scene.elements) drawElement(ctx, el);
    // draw traced rays on top
    for (const ray of result.rays) drawRay(ctx, ray);

    // HUD
    if (hud) drawHUD(ctx, hud);
  }, [scene, showIntensity, hud]);

  return <canvas ref={canvasRef} className={className} />;
}

function drawElement(ctx: CanvasRenderingContext2D, el: SceneElement) {
  ctx.lineWidth = 1.5;
  if (el.kind === "interface") {
    ctx.strokeStyle = INTERFACE_COLOR;
    ctx.beginPath();
    ctx.moveTo(el.p1.x, el.p1.y);
    ctx.lineTo(el.p2.x, el.p2.y);
    ctx.stroke();
  } else if (el.kind === "thin-lens") {
    ctx.strokeStyle = LENS_COLOR;
    const perp = { x: -el.axis.y, y: el.axis.x };
    const p1 = { x: el.center.x - perp.x * el.apertureHalfWidth, y: el.center.y - perp.y * el.apertureHalfWidth };
    const p2 = { x: el.center.x + perp.x * el.apertureHalfWidth, y: el.center.y + perp.y * el.apertureHalfWidth };
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (el.kind === "screen") {
    ctx.strokeStyle = SCREEN_COLOR;
    const perp = { x: -el.axis.y, y: el.axis.x };
    const p1 = { x: el.center.x - perp.x * el.halfWidth, y: el.center.y - perp.y * el.halfWidth };
    const p2 = { x: el.center.x + perp.x * el.halfWidth, y: el.center.y + perp.y * el.halfWidth };
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (el.kind === "slit") {
    ctx.strokeStyle = SLIT_COLOR;
    ctx.beginPath();
    ctx.arc(el.center.x, el.center.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRay(ctx: CanvasRenderingContext2D, ray: { segments: { from: { x: number; y: number }; to: { x: number; y: number }; amplitude: number }[] }) {
  ctx.strokeStyle = RAY_COLOR;
  ctx.lineWidth = 1.3;
  for (const seg of ray.segments) {
    ctx.beginPath();
    ctx.moveTo(seg.from.x, seg.from.y);
    ctx.lineTo(seg.to.x, seg.to.y);
    ctx.stroke();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, hud: Record<string, string | number>) {
  ctx.fillStyle = HUD_COLOR;
  ctx.font = "11px ui-monospace, monospace";
  let y = 16;
  for (const [k, v] of Object.entries(hud)) {
    ctx.fillText(`${k}: ${v}`, 12, y);
    y += 14;
  }
}
