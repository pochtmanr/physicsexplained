import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useRef } from "react";
import scenes from "@/messages/en/scenes.json";
import {
  SceneControls,
  SceneSlider,
  computeSceneSize,
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

describe("SceneSlider", () => {
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
