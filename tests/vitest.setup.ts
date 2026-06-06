import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom — Canvas-2D scenes use it via `useSceneSize`.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverMock;
}
