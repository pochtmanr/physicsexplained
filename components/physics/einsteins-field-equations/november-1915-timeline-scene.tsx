"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_SHORT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.37b — November 1915 timeline.
 *
 * Canvas 2D horizontal timeline of the six weeks that produced the Einstein
 * field equations.  Four key events:
 *
 *   Nov  4:  Einstein presents near-final form at the Berlin Academy.
 *   Nov 18:  Einstein submits the corrected form (R_{μν} − ½ R g_{μν} = κ T_{μν}).
 *   Nov 20:  Hilbert presents the variational derivation in Göttingen.
 *   Nov 25:  Einstein presents the final, definitive form.
 *
 * Clicking on each node expands a detail card below the timeline.
 */

const PAD = 24;

interface TimelineEvent {
  id: string;
  date: string;
  dateShort: string;
  x: number; // fractional position 0–1
  actor: "einstein" | "hilbert";
  headline: string;
  detail: string;
  color: string;
}

type EventSpec = Omit<TimelineEvent, "color"> & { colorKey: "cyan" | "magenta" };

const EVENT_SPECS: EventSpec[] = [
  {
    id: "nov4",
    date: "November 4, 1915",
    dateShort: "Nov 4",
    x: 0.08,
    actor: "einstein",
    headline: "Near-final form",
    detail:
      "Einstein presents an almost-complete set of field equations to the Prussian Academy of Sciences in Berlin. The form is not yet fully covariant — the trace term is missing. But the machinery is in place.",
    colorKey: "cyan",
  },
  {
    id: "nov18",
    date: "November 18, 1915",
    dateShort: "Nov 18",
    x: 0.38,
    actor: "einstein",
    headline: "Corrected form + Mercury",
    detail:
      "Einstein submits the corrected equations R_{μν} − ½ R g_{μν} = κ T_{μν} and uses them to calculate the 43-arcsecond-per-century precession of Mercury's perihelion. \"I was beside myself with joy,\" he wrote to a friend.",
    colorKey: "cyan",
  },
  {
    id: "nov20",
    date: "November 20, 1915",
    dateShort: "Nov 20",
    x: 0.62,
    actor: "hilbert",
    headline: "Variational derivation",
    detail:
      "David Hilbert presents the Einstein-Hilbert action S = ∫ R √(−g) d⁴x in Göttingen. Varying this action with respect to the metric yields the field equations as the Euler-Lagrange conditions — the canonical \"why\" behind the equations.",
    colorKey: "magenta",
  },
  {
    id: "nov25",
    date: "November 25, 1915",
    dateShort: "Nov 25",
    x: 0.92,
    actor: "einstein",
    headline: "Final form published",
    detail:
      "Einstein publishes the definitive paper: G_{μν} = 8πG T_{μν} (in units where c = 1). General relativity is complete. Modern scholarship credits Einstein with the physical derivation and Hilbert with the variational form — both contributions stand independently.",
    colorKey: "cyan",
  },
];

export function November1915TimelineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.43,
    maxHeight: SCENE_HEIGHT_SHORT,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const trackY = height * 0.4;

  const events = useMemo<TimelineEvent[]>(
    () =>
      EVENT_SPECS.map((spec) => ({
        id: spec.id,
        date: spec.date,
        dateShort: spec.dateShort,
        x: spec.x,
        actor: spec.actor,
        headline: spec.headline,
        detail: spec.detail,
        color: tokens[spec.colorKey],
      })),
    [tokens],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const W = width;
    const H = height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = tokens.textDim;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NOVEMBER 1915 — SIX WEEKS THAT CHANGED PHYSICS", W / 2, PAD + 6);

    // Timeline track
    const trackX0 = PAD + 12;
    const trackX1 = W - PAD - 12;

    // Month label
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("BERLIN / GÖTTINGEN  ·  Nov 1915", trackX0, trackY - 28);

    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trackX0, trackY);
    ctx.lineTo(trackX1, trackY);
    ctx.stroke();

    // End markers
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackX0, trackY - 8);
    ctx.lineTo(trackX0, trackY + 8);
    ctx.moveTo(trackX1, trackY - 8);
    ctx.lineTo(trackX1, trackY + 8);
    ctx.stroke();

    ctx.fillStyle = tokens.textFaint;
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Nov 1", trackX0, trackY + 20);
    ctx.fillText("Nov 30", trackX1, trackY + 20);

    // Events
    for (const ev of events) {
      const x = trackX0 + ev.x * (trackX1 - trackX0);
      const isSelected = selected === ev.id;
      const nodeR = isSelected ? 10 : 7;

      // Vertical connector line
      const above = ev.actor === "einstein";
      const connectorLen = 50;
      const labelY = above ? trackY - connectorLen : trackY + connectorLen;

      ctx.strokeStyle = isSelected ? ev.color : hexToRgba(ev.color, 0.33);
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, trackY - (above ? nodeR : -nodeR));
      ctx.lineTo(x, labelY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Node circle
      if (isSelected) {
        const glow = ctx.createRadialGradient(x, trackY, nodeR, x, trackY, nodeR * 4);
        glow.addColorStop(0, hexToRgba(ev.color, 0.33));
        glow.addColorStop(1, hexToRgba(ev.color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, trackY, nodeR * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isSelected ? ev.color : hexToRgba(ev.color, 0.53);
      ctx.beginPath();
      ctx.arc(x, trackY, nodeR, 0, Math.PI * 2);
      ctx.fill();

      // Date label
      ctx.fillStyle = isSelected ? ev.color : tokens.textDim;
      ctx.font = `${isSelected ? "bold " : ""}10px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(ev.dateShort, x, above ? labelY - 22 : labelY + 22);

      // Headline label
      ctx.fillStyle = isSelected ? ev.color : tokens.textMute;
      ctx.font = `${isSelected ? "bold " : ""}9px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(ev.headline, x, above ? labelY - 10 : labelY + 34);

      // Actor label
      const actorLabel = ev.actor === "einstein" ? "EINSTEIN · BERLIN" : "HILBERT · GÖTTINGEN";
      ctx.fillStyle = isSelected ? hexToRgba(ev.color, 0.8) : tokens.textFaint;
      ctx.font = "8px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(actorLabel, x, above ? labelY + 2 : labelY + 48);
    }

    // Detail card at bottom
    const activeEvent = events.find((e) => e.id === selected);
    if (activeEvent) {
      const cardY = H - 82;
      ctx.fillStyle = hexToRgba(tokens.bg, 0.9);
      ctx.beginPath();
      ctx.roundRect(PAD, cardY, W - PAD * 2, 68, 6);
      ctx.fill();

      ctx.strokeStyle = hexToRgba(activeEvent.color, 0.27);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(PAD, cardY, W - PAD * 2, 68, 6);
      ctx.stroke();

      ctx.fillStyle = activeEvent.color;
      ctx.font = "bold 10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${activeEvent.date} — ${activeEvent.headline}`, PAD + 10, cardY + 18);

      ctx.fillStyle = tokens.textDim;
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "left";
      const words = activeEvent.detail.split(" ");
      let line = "";
      let lineY = cardY + 33;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > W - PAD * 2 - 20) {
          ctx.fillText(line, PAD + 10, lineY);
          line = word;
          lineY += 13;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, PAD + 10, lineY);
    } else {
      ctx.fillStyle = tokens.textFaint;
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("← click a node to read the story of each day →", W / 2, H - 50);
    }
  }, [selected, trackY, tokens, events, width, height]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const trackX0 = PAD + 12;
    const trackX1 = width - PAD - 12;

    for (const ev of events) {
      const x = trackX0 + ev.x * (trackX1 - trackX0);
      const dist = Math.sqrt((mx - x) ** 2 + (my - trackY) ** 2);
      if (dist < 18) {
        setSelected(selected === ev.id ? null : ev.id);
        return;
      }
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2 p-2 w-full">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={`cursor-pointer ${SCENE_CANVAS_CLASS}`}
        style={{ width, height, display: "block" }}
      />
      <p className="px-1 font-mono text-xs text-[var(--color-fg-3)]">
        Six weeks, November 1915. Einstein and Hilbert working independently — the
        physical derivation and the variational form of the same equation. Click each
        node to read the story of that day.
      </p>
    </div>
  );
}
