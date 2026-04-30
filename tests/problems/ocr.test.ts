import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  getServiceClient: vi.fn(),
}));

import { extractAndMatch, _resetOcrDeps } from "@/lib/problems/ocr";

const TOPIC_SLUGS = ["vectors-and-projectile-motion", "the-simple-pendulum"];
const EQUATION_SLUGS = ["projectile-range", "small-angle-pendulum-period"];

const VALID_VISION_RESPONSE = {
  content: [{ type: "text", text: JSON.stringify({
    statement: "A ball is launched at 30 m/s at 45 degrees. How far does it travel?",
    topicGuess: "vectors-and-projectile-motion",
    inputs: { v_0: "30 m/s", theta: "45 deg" },
    equations: ["projectile-range"],
  }) }],
  usage: { input_tokens: 500, output_tokens: 60 },
};

describe("extractAndMatch — vision call + matching", () => {
  let mockVision: ReturnType<typeof vi.fn>;
  let mockMatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockVision = vi.fn(async () => VALID_VISION_RESPONSE);
    mockMatch = vi.fn(async () => [
      { id: "projectile-range-easy-1", primary_topic_slug: "vectors-and-projectile-motion", score: 0.91 },
    ]);
    _resetOcrDeps({
      anthropicCreate: mockVision,
      catalogMatch: mockMatch,
      topicSlugs: TOPIC_SLUGS,
      equationSlugs: EQUATION_SLUGS,
    });
  });

  it("returns a confident match when score > 0.7", async () => {
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(r.kind).toBe("match");
    if (r.kind === "match") {
      expect(r.problemId).toBe("projectile-range-easy-1");
      expect(r.score).toBeGreaterThan(0.7);
    }
  });

  it("falls through when no match exceeds 0.7", async () => {
    mockMatch.mockResolvedValueOnce([{ id: "x", primary_topic_slug: "y", score: 0.4 }]);
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(r.kind).toBe("fallthrough");
    if (r.kind === "fallthrough") {
      expect(r.statement).toContain("ball is launched");
    }
  });

  it("falls through when the catalog returns no rows", async () => {
    mockMatch.mockResolvedValueOnce([]);
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(r.kind).toBe("fallthrough");
  });

  it("rejects malformed vision JSON", async () => {
    mockVision.mockResolvedValueOnce({
      content: [{ type: "text", text: "not json at all" }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(r.kind).toBe("error");
  });

  it("includes topicSlugs and equationSlugs in the system prompt", async () => {
    await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    const args = mockVision.mock.calls[0][0];
    expect(args.system).toContain("vectors-and-projectile-motion");
    expect(args.system).toContain("projectile-range");
  });

  it("passes image as base64 in user message", async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
    await extractAndMatch({ imageBytes: bytes, mimeType: "image/png", locale: "en" });
    const args = mockVision.mock.calls[0][0];
    const userMsg = args.messages[0];
    const imageBlock = userMsg.content.find((c: { type: string }) => c.type === "image");
    expect(imageBlock).toBeTruthy();
    expect(imageBlock.source.media_type).toBe("image/png");
    expect(imageBlock.source.data).toBe(bytes.toString("base64"));
  });

  it("returns the top match when multiple confident matches exist", async () => {
    mockMatch.mockResolvedValueOnce([
      { id: "a", primary_topic_slug: "x", score: 0.85 },
      { id: "b", primary_topic_slug: "x", score: 0.92 },
    ]);
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(r.kind).toBe("match");
    if (r.kind === "match") expect(r.problemId).toBe("b");
  });

  it("rejects unsupported image MIME types", async () => {
    const r = await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/svg+xml", locale: "en" });
    expect(r.kind).toBe("error");
    expect(mockVision).not.toHaveBeenCalled();
  });

  it("propagates locale into the system prompt", async () => {
    await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "he" });
    const args = mockVision.mock.calls[0][0];
    expect(args.system).toMatch(/he/);
  });

  it("uses claude-sonnet-4-6 model", async () => {
    await extractAndMatch({ imageBytes: Buffer.from("fake"), mimeType: "image/png", locale: "en" });
    expect(mockVision.mock.calls[0][0].model).toBe("claude-sonnet-4-6");
  });
});
