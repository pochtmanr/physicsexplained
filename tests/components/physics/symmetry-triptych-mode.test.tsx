import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { SymmetryTriptychScene } from "@/components/physics/symmetry-triptych-scene";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ROShim {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { ResizeObserver: typeof ROShim }).ResizeObserver = ROShim;
  }
  if (typeof globalThis.IntersectionObserver === "undefined") {
    class IOShim {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds: number[] = [];
    }
    (globalThis as unknown as { IntersectionObserver: typeof IOShim }).IntersectionObserver = IOShim;
  }
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SymmetryTriptychScene", () => {
  it("renders the three tab buttons by default", () => {
    render(<SymmetryTriptychScene />);
    expect(screen.getByRole("button", { name: /time → energy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /space → momentum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rotation → angular L/i })).toBeInTheDocument();
  });

  it("hides the tab buttons when mode is a fixed mode", () => {
    render(<SymmetryTriptychScene mode="space" />);
    expect(screen.queryByRole("button", { name: /time → energy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /space → momentum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rotation → angular L/i })).not.toBeInTheDocument();
  });

  it("hides the tab buttons when mode is auto", () => {
    render(<SymmetryTriptychScene mode="auto" />);
    expect(screen.queryByRole("button", { name: /time → energy/i })).not.toBeInTheDocument();
  });
});
