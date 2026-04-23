import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FramedCard } from "@/components/layout/framed-card";

afterEach(() => cleanup());

describe("FramedCard", () => {
  it("renders its children", () => {
    render(
      <FramedCard>
        <div data-testid="child-content">hello</div>
      </FramedCard>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders the FIG label when provided", () => {
    render(
      <FramedCard figLabel="FIG.01 · THE EPICYCLE">
        <span>content</span>
      </FramedCard>,
    );
    expect(screen.getByText("FIG.01 · THE EPICYCLE")).toBeInTheDocument();
  });

  it("omits the FIG label when not provided", () => {
    render(
      <FramedCard>
        <span>content</span>
      </FramedCard>,
    );
    // No element should contain "FIG." text
    expect(screen.queryByText(/FIG\./)).not.toBeInTheDocument();
  });

  it("renders the four corner accent spans", () => {
    const { container } = render(
      <FramedCard>
        <span>content</span>
      </FramedCard>,
    );
    // section-frame.module.css uses a `.shellCorner` base class; four spans
    const corners = container.querySelectorAll('[aria-hidden="true"]');
    // At least the four corners; the optional label is not aria-hidden
    expect(corners.length).toBeGreaterThanOrEqual(4);
  });
});
