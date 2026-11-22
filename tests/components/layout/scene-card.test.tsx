import { afterEach, describe, expect, it } from "vitest";
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
