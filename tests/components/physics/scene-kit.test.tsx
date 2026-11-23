import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useRef } from "react";
import scenes from "@/messages/en/scenes.json";
import {
  SceneControls,
  SceneSlider,
  computeSceneSize,
  formatTick,
  niceTicks,
  rangeFraction,
  useScenePlayback,
} from "@/components/physics/_shared";

const FRAME_MS = 16;

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

const draws: number[] = [];

function Harness({ duration = 1, rate = 1 }: { duration?: number; rate?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const playback = useScenePlayback({
    elementRef: ref,
    duration,
    rate,
    draw: (t) => draws.push(t),
  });
  return (
    <div ref={ref}>
      <span data-testid="status">{playback.status}</span>
      <SceneControls playback={playback} scrub />
    </div>
  );
}

function renderHarness(props?: { duration?: number; rate?: number }) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ scenes }}>
      <Harness {...props} />
    </NextIntlClientProvider>,
  );
}

/** Advance fake time one animation frame at a time so React can flush between frames. */
function runFor(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    act(() => {
      vi.advanceTimersByTime(FRAME_MS);
    });
  }
}

const status = () => screen.getByTestId("status").textContent;
const lastDraw = () => draws[draws.length - 1];

beforeEach(() => {
  draws.length = 0;
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"],
  });
  stubReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useScenePlayback", () => {
  it("plays once on view, then holds the last frame", () => {
    renderHarness({ duration: 1 });
    runFor(300);
    expect(status()).toBe("playing");
    expect(lastDraw()).toBeGreaterThan(0.1);
    expect(lastDraw()).toBeLessThan(1);

    runFor(1500);
    expect(status()).toBe("ended");
    expect(lastDraw()).toBe(1);

    const drawsAtEnd = draws.length;
    runFor(2000);
    // No animation frames are spent on a scene that has ended.
    expect(draws.length).toBe(drawsAtEnd);
    expect(status()).toBe("ended");
  });

  it("pauses and resumes from the same time", () => {
    renderHarness({ duration: 5 });
    runFor(400);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(status()).toBe("paused");
    const pausedAt = lastDraw();
    runFor(1000);
    expect(lastDraw()).toBe(pausedAt);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    runFor(200);
    expect(status()).toBe("playing");
    expect(lastDraw()).toBeGreaterThan(pausedAt);
    expect(lastDraw()).toBeLessThan(pausedAt + 0.5);
  });

  it("replays from zero after the end", () => {
    renderHarness({ duration: 0.5 });
    runFor(1000);
    expect(status()).toBe("ended");
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(lastDraw()).toBe(0);
    runFor(200);
    expect(status()).toBe("playing");
    expect(lastDraw()).toBeLessThan(0.5);
  });

  it("restarts after a hold when loop is on", () => {
    renderHarness({ duration: 0.5 });
    fireEvent.click(screen.getByRole("button", { name: "Loop" }));
    runFor(1000);
    // Past the end but inside the hold: still on the last frame.
    expect(status()).toBe("playing");
    expect(lastDraw()).toBe(0.5);
    runFor(1500);
    expect(status()).toBe("playing");
    expect(lastDraw()).toBeLessThan(0.5);
  });

  it("scales scene time by the playback rate", () => {
    renderHarness({ duration: 10, rate: 0.5 });
    runFor(1000);
    expect(lastDraw()).toBeGreaterThan(0.4);
    expect(lastDraw()).toBeLessThan(0.55);
  });

  it("scrubbing back from the end leaves the scene paused, not ended", () => {
    renderHarness({ duration: 0.5 });
    runFor(1000);
    expect(status()).toBe("ended");
    fireEvent.change(screen.getByRole("slider", { name: "Time" }), {
      target: { value: "0.2" },
    });
    expect(lastDraw()).toBeCloseTo(0.2, 5);
    expect(status()).toBe("paused");
  });

  it("does not autoplay when the reader prefers reduced motion", () => {
    stubReducedMotion(true);
    renderHarness({ duration: 1 });
    runFor(1000);
    expect(status()).toBe("idle");
    expect(lastDraw()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    runFor(200);
    expect(status()).toBe("playing");
  });
});

/** A body moving at `speed` until it has covered one unit; `speed` can change mid-run. */
const sim = { x: 0, steps: [] as number[], resets: 0 };

function SimHarness({ speed, rate = 1 }: { speed: number; rate?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const playback = useScenePlayback({
    elementRef: ref,
    rate,
    simulation: {
      step: (dt) => {
        sim.steps.push(dt);
        sim.x = Math.min(1, sim.x + speed * dt);
      },
      reset: () => {
        sim.x = 0;
        sim.resets += 1;
      },
      isDone: () => sim.x >= 1,
    },
    draw: (t) => draws.push(t),
  });
  return (
    <div ref={ref}>
      <span data-testid="status">{playback.status}</span>
      <span data-testid="time">{playback.time}</span>
      <SceneControls playback={playback} />
    </div>
  );
}

function SeekHarness() {
  const ref = useRef<HTMLDivElement>(null);
  const playback = useScenePlayback({
    elementRef: ref,
    simulation: {
      step: (dt) => {
        sim.x = Math.min(1, sim.x + dt);
      },
      reset: () => {
        sim.x = 0;
        sim.resets += 1;
      },
      isDone: () => sim.x >= 1,
    },
    draw: () => {},
  });
  return (
    <div ref={ref}>
      <span data-testid="status">{playback.status}</span>
      <button onClick={() => playback.seek(0.5)}>seek later</button>
      <button onClick={() => playback.seek(0)}>seek start</button>
    </div>
  );
}

function renderSim(speed: number, rate?: number) {
  const ui = (s: number) => (
    <NextIntlClientProvider locale="en" messages={{ scenes }}>
      <SimHarness speed={s} rate={rate} />
    </NextIntlClientProvider>
  );
  const view = render(ui(speed));
  return { setSpeed: (s: number) => view.rerender(ui(s)) };
}

describe("useScenePlayback with a simulation", () => {
  beforeEach(() => {
    sim.x = 0;
    sim.steps = [];
    sim.resets = 0;
  });

  it("steps the state each frame and ends when the simulation says so", () => {
    renderSim(2);
    runFor(300);
    expect(status()).toBe("playing");
    expect(sim.x).toBeGreaterThan(0.3);
    expect(sim.x).toBeLessThan(1);
    runFor(500);
    expect(sim.x).toBe(1);
    expect(status()).toBe("ended");
    const stepsAtEnd = sim.steps.length;
    runFor(500);
    expect(sim.steps.length).toBe(stepsAtEnd);
  });

  it("passes scene time, scaled by the playback rate, to each step", () => {
    renderSim(0.1, 0.5);
    runFor(400);
    const moving = sim.steps.filter((dt) => dt > 0);
    expect(moving.length).toBeGreaterThan(5);
    for (const dt of moving) expect(dt).toBeCloseTo((FRAME_MS / 1000) * 0.5, 6);
  });

  it("keeps position and time when a parameter changes mid-run", () => {
    const { setSpeed } = renderSim(0.2);
    runFor(500);
    const xBefore = sim.x;
    const tBefore = lastDraw();
    expect(xBefore).toBeGreaterThan(0.05);

    setSpeed(0.05);
    expect(sim.resets).toBe(0);
    expect(sim.x).toBe(xBefore);
    expect(status()).toBe("playing");

    runFor(200);
    // Carries on from where it was, at the new, slower speed.
    expect(lastDraw()).toBeGreaterThan(tBefore);
    expect(sim.x).toBeGreaterThan(xBefore);
    expect(sim.x - xBefore).toBeLessThan(0.02);
    expect(sim.resets).toBe(0);
  });

  it("stops and reports once when a step throws, and can be replayed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { setSpeed } = renderSim(Number.NaN);
    // NaN speed stands in for a broken scene: make the step throw instead.
    const realPush = sim.steps.push.bind(sim.steps);
    sim.steps.push = () => {
      throw new Error("boom");
    };
    runFor(200);
    expect(status()).toBe("paused");
    expect(error).toHaveBeenCalledTimes(1);

    sim.steps.push = realPush;
    setSpeed(4);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    runFor(600);
    expect(status()).toBe("ended");
    error.mockRestore();
  });

  it("can only seek back to the start", () => {
    const view = render(
      <NextIntlClientProvider locale="en" messages={{ scenes }}>
        <SeekHarness />
      </NextIntlClientProvider>,
    );
    runFor(300);
    const xMid = sim.x;
    expect(xMid).toBeGreaterThan(0);
    // An arbitrary time has no state to go to: ignored, nothing is reset.
    fireEvent.click(screen.getByRole("button", { name: "seek later" }));
    expect(sim.resets).toBe(0);
    expect(sim.x).toBe(xMid);

    runFor(1500);
    expect(status()).toBe("ended");
    // Back to the start: rewound and waiting, not playing.
    fireEvent.click(screen.getByRole("button", { name: "seek start" }));
    expect(sim.resets).toBe(1);
    expect(sim.x).toBe(0);
    expect(status()).toBe("paused");
    view.unmount();
  });

  it("resets the state on replay and plays again", () => {
    renderSim(4);
    runFor(600);
    expect(status()).toBe("ended");
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(sim.resets).toBe(1);
    expect(sim.x).toBe(0);
    expect(lastDraw()).toBe(0);
    runFor(100);
    expect(status()).toBe("playing");
    expect(sim.x).toBeGreaterThan(0);
  });

  it("starts over when Play is pressed after the end", () => {
    renderSim(4);
    runFor(600);
    expect(status()).toBe("ended");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(sim.resets).toBe(1);
    runFor(100);
    expect(status()).toBe("playing");
  });

  it("holds, then resets and runs again when loop is on", () => {
    // One run lasts a second; the hold after it lasts LOOP_HOLD_SECONDS.
    renderSim(1);
    fireEvent.click(screen.getByRole("button", { name: "Loop" }));
    runFor(1200);
    expect(sim.x).toBe(1);
    expect(status()).toBe("playing");
    expect(sim.resets).toBe(0);
    runFor(1500);
    // Past the hold and a little way into the second run.
    expect(sim.resets).toBe(1);
    expect(sim.x).toBeGreaterThan(0);
    expect(sim.x).toBeLessThan(1);
  });
});

describe("SceneSlider", () => {
  it("reports the end of an adjustment separately from each change", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <SceneSlider label="Air" value={50} min={0} max={100} onChange={onChange} onCommit={onCommit} />,
    );
    const slider = screen.getByLabelText("Air");
    fireEvent.change(slider, { target: { value: "60" } });
    fireEvent.change(slider, { target: { value: "70" } });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider);
    expect(onCommit).toHaveBeenCalledTimes(1);
    // A touch taken over by scrolling, or focus leaving, also ends it.
    fireEvent.pointerCancel(slider);
    fireEvent.blur(slider);
    expect(onCommit).toHaveBeenCalledTimes(3);
  });

  it("ties the label to the input and reports numeric changes", () => {
    const onChange = vi.fn();
    render(
      <SceneSlider label="Angle" value={18} min={5} max={45} onChange={onChange} display="18°" />,
    );
    const slider = screen.getByLabelText("Angle");
    expect(slider).toHaveAttribute("type", "range");
    fireEvent.change(slider, { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledWith(30);
    expect(screen.getByText("18°")).toBeInTheDocument();
  });
});

describe("computeSceneSize", () => {
  const base = { ratio: 0.5, maxHeight: 360, minHeight: 200 };

  it("follows the container width inline, capped at maxHeight", () => {
    expect(computeSceneSize({ ...base, containerWidth: 600 })).toEqual({ width: 600, height: 300 });
    expect(computeSceneSize({ ...base, containerWidth: 1000 })).toEqual({ width: 1000, height: 360 });
    expect(computeSceneSize({ ...base, containerWidth: 300 })).toEqual({ width: 300, height: 200 });
  });

  it("in full view keeps the container width by default", () => {
    const size = computeSceneSize({
      ...base,
      containerWidth: 1200,
      availableHeight: 800,
      chromeHeight: 100,
    });
    // 1200 × 0.5 = 600 fits in the 700 available; maxHeight (360) no longer applies.
    expect(size).toEqual({ width: 1200, height: 600 });
  });

  it("in ratio mode fills the height when the window is wide", () => {
    const size = computeSceneSize({
      ...base,
      fullView: "ratio",
      containerWidth: 1800,
      availableHeight: 800,
      chromeHeight: 100,
    });
    expect(size).toEqual({ width: 1400, height: 700 });
  });

  it("in ratio mode fills the width when the window is narrow", () => {
    const size = computeSceneSize({
      ...base,
      fullView: "ratio",
      containerWidth: 360,
      availableHeight: 700,
      chromeHeight: 120,
    });
    // 360 × 0.5 = 180 would be shorter than the inline figure (minHeight 200).
    expect(size).toEqual({ width: 360, height: 200 });
  });

  it("never exceeds the available height in full view", () => {
    for (const fullView of ["width", "ratio", "fill"] as const)
    for (const containerWidth of [320, 768, 1280, 2000]) {
      const size = computeSceneSize({
        ...base,
        fullView,
        containerWidth,
        availableHeight: 600,
        chromeHeight: 150,
      });
      expect(size.height + 150).toBeLessThanOrEqual(600);
      expect(size.width).toBeLessThanOrEqual(containerWidth);
    }
  });
});

describe("computeSceneSize with fill", () => {
  it("uses the whole width and the whole remaining height in full view", () => {
    const size = computeSceneSize({
      ratio: 1.05,
      maxHeight: 620,
      minHeight: 340,
      containerWidth: 1200,
      availableHeight: 780,
      chromeHeight: 240,
      fullView: "fill",
    });
    expect(size).toEqual({ width: 1200, height: 540 });
  });

  it("is ignored inline", () => {
    const size = computeSceneSize({
      ratio: 1.05,
      maxHeight: 620,
      minHeight: 340,
      containerWidth: 700,
      fullView: "fill",
    });
    expect(size).toEqual({ width: 700, height: 620 });
  });
});

describe("niceTicks", () => {
  it("picks round steps of 1, 2 or 5 times a power of ten", () => {
    expect(niceTicks(0, 5.4, 4)).toEqual({ ticks: [0, 1, 2, 3, 4, 5], step: 1 });
    expect(niceTicks(0, 22, 4)).toEqual({ ticks: [0, 5, 10, 15, 20], step: 5 });
    expect(niceTicks(-0.3, 0.9, 4).step).toBeCloseTo(0.2, 12);
  });

  it("includes zero exactly, without -0 or rounding drift", () => {
    const { ticks, step } = niceTicks(-1.3, 1.3, 4);
    expect(ticks).toContain(0);
    expect(ticks.some((t) => Object.is(t, -0))).toBe(false);
    expect(ticks.map((t) => formatTick(t, step))).toEqual(["-1.0", "-0.5", "0.0", "0.5", "1.0"]);
  });

  it("returns one tick, not a hang, for ranges doubles cannot count through", () => {
    expect(niceTicks(2 ** 60, 2 ** 60 + 256).ticks).toHaveLength(1);
    expect(niceTicks(-5e-324, 1.5e-323).ticks).toHaveLength(1);
    expect(niceTicks(0, 10, Number.NaN).ticks.length).toBeGreaterThan(1);
    expect(niceTicks(0, 10, 1e7).ticks.length).toBeLessThanOrEqual(101);
  });

  it("stays inside the range and survives a flat one", () => {
    const { ticks } = niceTicks(0.31, 7.9, 4);
    expect(Math.min(...ticks)).toBeGreaterThanOrEqual(0.31);
    expect(Math.max(...ticks)).toBeLessThanOrEqual(7.9);
    expect(niceTicks(2, 2).ticks).toEqual([2]);
  });

  it("formats with the decimals the step needs", () => {
    expect(formatTick(10, 5)).toBe("10");
    expect(formatTick(0.5, 0.5)).toBe("0.5");
    expect(formatTick(0.25, 0.05)).toBe("0.25");
  });
});

describe("SceneRange fill", () => {
  it("reports how far along the track the value is", () => {
    expect(rangeFraction(18, 5, 45)).toBeCloseTo(0.325, 12);
    expect(rangeFraction(-5, -5, 5)).toBe(0);
    expect(rangeFraction(9, 0, 5)).toBe(1);
    expect(rangeFraction(1, 3, 3)).toBe(0);
  });

  it("passes the fraction to the stylesheet", () => {
    render(<SceneSlider label="Air" value={25} min={0} max={100} onChange={() => {}} />);
    const slider = screen.getByLabelText("Air");
    expect(slider).toHaveClass("scene-range");
    expect(slider.style.getPropertyValue("--range-frac")).toBe("0.25");
  });
});
