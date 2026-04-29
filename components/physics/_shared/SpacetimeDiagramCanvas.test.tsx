import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpacetimeDiagramCanvas } from "./SpacetimeDiagramCanvas";
import type { Worldline } from "@/lib/physics/relativity/types";

describe("SpacetimeDiagramCanvas", () => {
  it("renders without crashing on an empty worldline list", () => {
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[]} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders a single worldline + light cone", () => {
    const wl: Worldline = {
      events: [
        { t: 0, x: 0, y: 0, z: 0 },
        { t: 1, x: 0, y: 0, z: 0 },
        { t: 2, x: 0, y: 0, z: 0 },
      ],
      color: "#67E8F9",
      label: "stationary",
    };
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[wl]} lightCone={true} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders boost slider when onBoostChange is provided", () => {
    const { container } = render(
      <SpacetimeDiagramCanvas worldlines={[]} boostBeta={0.3} onBoostChange={() => {}} />,
    );
    expect(container.querySelector("input[type=range]")).not.toBeNull();
  });

  it("hides boost slider in uncontrolled (no onBoostChange) mode", () => {
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[]} boostBeta={0.5} />);
    expect(container.querySelector("input[type=range]")).toBeNull();
  });
});
