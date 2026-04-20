import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseMdx } from "@/scripts/content/parse-mdx";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

const names = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));

describe("parseMdx — fixtures", () => {
  for (const name of names) {
    it(`parses ${name}`, () => {
      const mdx = readFileSync(path.join(FIXTURES, `${name}.mdx`), "utf8");
      const expected = JSON.parse(
        readFileSync(path.join(FIXTURES, `${name}.expected.json`), "utf8"),
      );
      expect(parseMdx(mdx)).toEqual(expected);
    });
  }
});
