import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ManifoldCanvas,
  type ManifoldEmbedding,
  type ParallelTransportPath,
  type TangentArrow,
} from "./ManifoldCanvas";

/** Unit-sphere embedding (u = polar, v = azimuthal). */
const sphere: ManifoldEmbedding = (u, v) => [
  Math.cos(v) * Math.sin(u),
  Math.sin(v) * Math.sin(u),
  Math.cos(u),
];

describe("ManifoldCanvas", () => {
  it("renders without crashing on the default (sphere) embedding", () => {
    const { container } = render(<ManifoldCanvas embedding={sphere} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders without crashing when tangentArrows are supplied", () => {
    const arrows: TangentArrow[] = [
      { base: { u: Math.PI / 2, v: 0 }, vector: [1, 0], label: "∂_u" },
      { base: { u: Math.PI / 2, v: Math.PI / 2 }, vector: [0, 1], color: "#FFD66B" },
    ];
    const { container } = render(
      <ManifoldCanvas embedding={sphere} tangentArrows={arrows} />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders without crashing when parallelTransport is supplied", () => {
    const curve = Array.from({ length: 12 }, (_, i) => ({
      u: Math.PI / 2,
      v: (i / 11) * Math.PI,
    }));
    const transported = curve.map(() => [1, 0] as const);
    const transport: ParallelTransportPath = {
      curve,
      initialVector: [1, 0],
      transportedVectors: transported,
      label: "PT",
    };
    const { container } = render(
      <ManifoldCanvas embedding={sphere} parallelTransport={transport} />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders a geodesic overlay without crashing", () => {
    const geodesic = Array.from({ length: 30 }, (_, i) => ({
      u: Math.PI / 2,
      v: (i / 29) * 2 * Math.PI,
    }));
    const { container } = render(
      <ManifoldCanvas embedding={sphere} geodesic={geodesic} />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders rotation slider when onRotationChange is provided", () => {
    const { container } = render(
      <ManifoldCanvas
        embedding={sphere}
        rotationY={0.5}
        onRotationChange={() => {}}
      />,
    );
    expect(container.querySelector("input[type=range]")).not.toBeNull();
  });

  it("hides rotation slider in uncontrolled (no onRotationChange) mode", () => {
    const { container } = render(<ManifoldCanvas embedding={sphere} rotationY={0.5} />);
    expect(container.querySelector("input[type=range]")).toBeNull();
  });

  it("accepts a palette override prop without crashing", () => {
    const { container } = render(
      <ManifoldCanvas
        embedding={sphere}
        palette={{
          surface: "rgba(255,255,255,0.4)",
          highlight: "#00FF00",
          transport: "#FF00FF",
          background: "#111111",
          axes: "#FFFFFF",
        }}
      />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders a hyperboloid embedding without crashing", () => {
    const hyperboloid: ManifoldEmbedding = (u, v) => [
      Math.cosh(u) * Math.cos(v),
      Math.cosh(u) * Math.sin(v),
      Math.sinh(u),
    ];
    const { container } = render(
      <ManifoldCanvas
        embedding={hyperboloid}
        uRange={[-1.2, 1.2]}
        vRange={[0, 2 * Math.PI]}
      />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});
