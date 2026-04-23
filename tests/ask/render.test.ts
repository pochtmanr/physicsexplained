import { describe, it, expect } from "vitest";
import { parseFences } from "@/lib/ask/render";

describe("parseFences", () => {
  it("parses canonical scene fence with newline", () => {
    const parts = parseFences('Intro.\n:::scene{id="Foo"}\n:::\nAfter.');
    expect(parts).toEqual([
      { kind: "text", text: "Intro.\n" },
      { kind: "scene", id: "Foo", params: {} },
      { kind: "text", text: "\nAfter." },
    ]);
  });

  it("tolerates inline scene fence without a newline", () => {
    const parts = parseFences(':::scene{id="Foo"}:::');
    expect(parts).toEqual([{ kind: "scene", id: "Foo", params: {} }]);
  });

  it("tolerates literal \\n escape leftover from JSON stringification", () => {
    const parts = parseFences(':::scene{id="Foo"}\\n:::');
    expect(parts).toEqual([{ kind: "scene", id: "Foo", params: {} }]);
  });

  it("parses plot fence with params", () => {
    const parts = parseFences(':::plot{kind="function" plotId="p_ab" expr="sin(x)" variable="x" domain=[-1,1]}\n:::');
    expect(parts[0]).toMatchObject({ kind: "plot", plotId: "p_ab" });
  });

  it("falls back to [[scene: Id]] hallucination as best-effort", () => {
    const parts = parseFences("before [[scene: ParallelPlateCapacitor]] after");
    expect(parts).toEqual([
      { kind: "text", text: "before " },
      { kind: "scene", id: "ParallelPlateCapacitor", params: {} },
      { kind: "text", text: " after" },
    ]);
  });

  it("returns plain text when no fences present", () => {
    expect(parseFences("no fences here")).toEqual([{ kind: "text", text: "no fences here" }]);
  });
});
