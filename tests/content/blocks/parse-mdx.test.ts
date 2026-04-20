// tests/content/blocks/parse-mdx.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMdx } from "@/scripts/content/parse-mdx";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

function readFixture(name: string) {
  return {
    mdx: readFileSync(path.join(FIXTURES, `${name}.mdx`), "utf8"),
    expected: JSON.parse(
      readFileSync(path.join(FIXTURES, `${name}.expected.json`), "utf8"),
    ),
  };
}

describe("parseMdx", () => {
  it("parses a single-section paragraph with a physicist link", () => {
    const { mdx, expected } = readFixture("paragraph");
    const result = parseMdx(mdx);
    expect(result).toEqual(expected);
  });
});
