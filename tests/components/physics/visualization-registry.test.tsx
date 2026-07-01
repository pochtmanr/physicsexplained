import { vi } from "vitest";

// Stub Supabase env before the registry (which transitively pulls scene deps)
// is imported, matching the pattern in content-blocks.test.tsx.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test-key";
});

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Visualization } from "@/components/physics/visualization-registry";

const realIO = globalThis.IntersectionObserver;

// Inert observer: never reports intersection, so a viewport-gated viz must
// keep showing the skeleton and never fetch/mount the scene.
class InertIO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver = InertIO;
});

afterEach(() => {
  cleanup();
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver = realIO;
});

describe("<Visualization>", () => {
  it("shows a skeleton and defers scene mounting until near the viewport", async () => {
    render(<Visualization vizKey="phase-portrait" />);
    expect(screen.getByText(/loading simulation/i)).toBeInTheDocument();
    // Give any (wrongly) eager dynamic import time to resolve.
    await new Promise((r) => setTimeout(r, 50));
    expect(document.querySelector("canvas")).toBeNull();
    expect(document.querySelector(".jxgbox")).toBeNull();
  });

  it("renders nothing for an unknown key", () => {
    const { container } = render(<Visualization vizKey="does-not-exist" />);
    expect(container).toBeEmptyDOMElement();
  });
});
