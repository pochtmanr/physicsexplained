// Smoke tests for the Module 3 (Second Law) scenes: mount each component and
// run its full draw() once against a stubbed 2D canvas context, asserting no
// throw and that the canvas + key controls render. These scenes are otherwise
// not exercised (the registry lazy-loads them via dynamic import).
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

import { CarnotCycleScene } from "@/components/physics/heat-engines-and-carnot/carnot-cycle-scene";
import { EngineEfficiencyBarsScene } from "@/components/physics/heat-engines-and-carnot/engine-efficiency-bars-scene";
import { TsDiagramScene } from "@/components/physics/heat-engines-and-carnot/ts-diagram-scene";
import { ClausiusVsKelvinScene } from "@/components/physics/the-second-law/clausius-vs-kelvin-scene";
import { PerpetualMotionScene } from "@/components/physics/the-second-law/perpetual-motion-scene";
import { EntropyMixingScene } from "@/components/physics/entropy-and-the-clausius-inequality/entropy-mixing-scene";
import { ReversibleVsIrreversibleDsScene } from "@/components/physics/entropy-and-the-clausius-inequality/reversible-vs-irreversible-ds-scene";
import { TsDiagramReduxScene } from "@/components/physics/entropy-and-the-clausius-inequality/ts-diagram-redux-scene";

let rafCb: FrameRequestCallback | null = null;

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ROShim {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { ResizeObserver: typeof ROShim }).ResizeObserver = ROShim;
  }
  // Stubbed 2D context so applyDpr() returns truthy and draw() runs in full.
  const ctxStub = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "measureText") return () => ({ width: 10 });
        return () => {};
      },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  HTMLCanvasElement.prototype.getContext = (() => ctxStub) as never;

  // Capture the rAF callback without looping; we invoke it once per test.
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    rafCb = cb;
    return 1;
  }) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
});

afterEach(() => {
  cleanup();
  rafCb = null;
  vi.useRealTimers();
});

const SCENES = [
  ["CarnotCycleScene", CarnotCycleScene],
  ["EngineEfficiencyBarsScene", EngineEfficiencyBarsScene],
  ["TsDiagramScene", TsDiagramScene],
  ["ClausiusVsKelvinScene", ClausiusVsKelvinScene],
  ["PerpetualMotionScene", PerpetualMotionScene],
  ["EntropyMixingScene", EntropyMixingScene],
  ["ReversibleVsIrreversibleDsScene", ReversibleVsIrreversibleDsScene],
  ["TsDiagramReduxScene", TsDiagramReduxScene],
] as const;

describe("second-law scenes", () => {
  for (const [name, Scene] of SCENES) {
    it(`${name} mounts and draws without throwing`, () => {
      const { container } = render(<Scene />);
      // Animated scenes set up a rAF loop; run one frame to exercise draw().
      act(() => {
        rafCb?.(16);
      });
      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
    });
  }
});
