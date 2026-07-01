import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { LazyMount } from "@/components/layout/lazy-mount";

// Controllable IntersectionObserver mock: records instances so tests can fire
// intersection changes by hand.
type IOCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IOCallback;
  observed: Element[] = [];
  disconnected = false;
  root = null;
  rootMargin = "";
  thresholds = [];

  constructor(callback: IOCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting }]);
  }
}

const realIO = globalThis.IntersectionObserver;

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver =
    MockIntersectionObserver;
});

afterEach(() => {
  cleanup();
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver = realIO;
  vi.restoreAllMocks();
});

describe("<LazyMount>", () => {
  it("renders the fallback, not children, before the element nears the viewport", () => {
    render(
      <LazyMount fallback={<div>placeholder</div>}>
        <div>heavy scene</div>
      </LazyMount>,
    );
    expect(screen.getByText("placeholder")).toBeInTheDocument();
    expect(screen.queryByText("heavy scene")).toBeNull();
    // It must actually be observing something, otherwise it would never mount.
    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(MockIntersectionObserver.instances[0].observed).toHaveLength(1);
  });

  it("mounts children once the observer reports intersection", () => {
    render(
      <LazyMount fallback={<div>placeholder</div>}>
        <div>heavy scene</div>
      </LazyMount>,
    );
    act(() => MockIntersectionObserver.instances[0].trigger(true));
    expect(screen.getByText("heavy scene")).toBeInTheDocument();
    expect(screen.queryByText("placeholder")).toBeNull();
  });

  it("stays mounted after scrolling back out of view", () => {
    render(
      <LazyMount fallback={<div>placeholder</div>}>
        <div>heavy scene</div>
      </LazyMount>,
    );
    const io = MockIntersectionObserver.instances[0];
    act(() => io.trigger(true));
    act(() => io.trigger(false));
    expect(screen.getByText("heavy scene")).toBeInTheDocument();
  });

  it("disconnects the observer after mounting", () => {
    render(
      <LazyMount fallback={<div>placeholder</div>}>
        <div>heavy scene</div>
      </LazyMount>,
    );
    const io = MockIntersectionObserver.instances[0];
    act(() => io.trigger(true));
    expect(io.disconnected).toBe(true);
  });

  it("mounts immediately when IntersectionObserver is unavailable", () => {
    delete (globalThis as unknown as Record<string, unknown>).IntersectionObserver;
    render(
      <LazyMount fallback={<div>placeholder</div>}>
        <div>heavy scene</div>
      </LazyMount>,
    );
    expect(screen.getByText("heavy scene")).toBeInTheDocument();
  });
});
