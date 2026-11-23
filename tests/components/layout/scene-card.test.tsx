import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import scenes from "@/messages/en/scenes.json";
import { SceneCard } from "@/components/layout/scene-card";
import { useSceneView } from "@/components/physics/_shared/scene-tokens";

let mounts = 0;

function Counter() {
  const [n, setN] = useState(() => {
    mounts += 1;
    return 0;
  });
  const view = useSceneView();
  return (
    <button onClick={() => setN((v) => v + 1)} data-expanded={view.expanded}>
      count {n}
    </button>
  );
}

// The app's React root is `document` (Next.js App Router), so the popup, which
// is portaled to <body>, is inside the root. Mirror that here: with the
// default detached container, a scene moved into the popup would sit outside
// the root and React would not deliver its events.
function renderCard() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ scenes }}>
      <SceneCard caption="FIG.01 — test">
        <Counter />
      </SceneCard>
    </NextIntlClientProvider>,
    { container: document.body },
  );
}

afterEach(() => {
  cleanup();
  mounts = 0;
});

describe("SceneCard full view", () => {
  it("keeps the scene's state when expanding and closing", () => {
    renderCard();
    // The scene mounts once on first render — no second mount behind a portal.
    expect(mounts).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /count 0/ }));
    fireEvent.click(screen.getByRole("button", { name: /count 1/ }));
    expect(screen.getByRole("button", { name: /count 2/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    const dialog = screen.getByRole("dialog", { name: "FIG.01 — test" });
    // Same live element, now inside the dialog, state intact.
    const inDialog = within(dialog).getByRole("button", { name: /count 2/ });
    expect(inDialog).toHaveAttribute("data-expanded", "true");
    fireEvent.click(inDialog);
    expect(within(dialog).getByRole("button", { name: /count 3/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const back = screen.getByRole("button", { name: /count 3/ });
    expect(back).toHaveAttribute("data-expanded", "false");
    expect(back.closest("figure")).not.toBeNull();
    expect(mounts).toBe(1);
  });

  it("closes on Escape and returns focus to the expand button", () => {
    renderCard();
    const expand = screen.getByRole("button", { name: "Expand figure" });
    fireEvent.click(expand);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(expand);
  });

  it("renders the scene exactly once at a time", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    expect(screen.getAllByRole("button", { name: /count/ })).toHaveLength(1);
  });

  it("unmounts cleanly while expanded", () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("omits the expand button when not expandable", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ scenes }}>
        <SceneCard caption="FIG.02" expandable={false}>
          <Counter />
        </SceneCard>
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Expand figure" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /count 0/ })).toBeInTheDocument();
  });
});

describe("SceneCard guide", () => {
  function renderWithGuide() {
    return render(
      <NextIntlClientProvider locale="en" messages={{ scenes }}>
        <SceneCard caption="FIG.01 — test" guide={<a href="/dictionary/derivative">derivative</a>}>
          <Counter />
        </SceneCard>
      </NextIntlClientProvider>,
      { container: document.body },
    );
  }

  /** Pretend the window is wide (room for the guide beside the figure) or not. */
  function stubLayout(beside: boolean) {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: beside, addEventListener() {}, removeEventListener() {} })),
    );
  }

  // The test environment has no storage; give it one that lasts a test.
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "localStorage");
  });

  it("still works when storage is unavailable", () => {
    Reflect.deleteProperty(window, "localStorage");
    stubLayout(true);
    renderWithGuide();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "derivative" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Guide" }));
    expect(within(dialog).queryByRole("link", { name: "derivative" })).toBeNull();
  });

  it("opens with the guide showing when the reader asks for the guide", () => {
    stubLayout(false);
    renderWithGuide();
    fireEvent.click(screen.getByRole("button", { name: "Open figure with guide" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "derivative" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Guide" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Closing gives focus back to the button that opened it.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open figure with guide" })).toHaveFocus();
  });

  it("starts with the guide closed where it would sit under the figure", () => {
    stubLayout(false);
    renderWithGuide();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    const dialog = screen.getByRole("dialog");
    const toggle = within(dialog).getByRole("button", { name: "Guide" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Not in the document at all, so Tab cannot reach its links.
    expect(within(dialog).queryByRole("link", { name: "derivative" })).toBeNull();
    fireEvent.click(toggle);
    expect(within(dialog).getByRole("link", { name: "derivative" })).toBeInTheDocument();
  });

  it("starts with the guide open beside the figure, and remembers a reader who closed it", () => {
    stubLayout(true);
    renderWithGuide();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "derivative" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Guide" }));
    expect(within(dialog).queryByRole("link", { name: "derivative" })).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("link", { name: "derivative" })).toBeNull();
    // The scene is still the one instance throughout.
    expect(mounts).toBe(1);
  });

  it("has no guide controls for a figure without a guide", () => {
    renderCard();
    expect(screen.queryByRole("button", { name: "Open figure with guide" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Expand figure" }));
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Guide" })).toBeNull();
  });
});
