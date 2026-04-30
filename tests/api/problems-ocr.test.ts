// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  getSsrClient: vi.fn(),
  getServiceClient: vi.fn(),
}));

import { POST, _resetOcrRouteDeps } from "@/app/api/problems/ocr/route";

function makeFormReq(file: { name: string; type: string; bytes: Buffer }, locale: string): Request {
  const body = new FormData();
  body.set("locale", locale);
  body.set("image", new File([file.bytes], file.name, { type: file.type }));
  return new Request("http://localhost/api/problems/ocr", { method: "POST", body });
}

describe("POST /api/problems/ocr", () => {
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockGetQuota: ReturnType<typeof vi.fn>;
  let mockBumpQuota: ReturnType<typeof vi.fn>;
  let mockExtract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUser = vi.fn(async () => ({ id: "u1" }));
    mockGetQuota = vi.fn(async () => ({ plan: "free", ocrUsedToday: 0 }));
    mockBumpQuota = vi.fn(async () => undefined);
    mockExtract = vi.fn(async () => ({ kind: "match" as const, problemId: "p1", topicSlug: "t1", score: 0.9, statement: "..." }));
    _resetOcrRouteDeps({
      getUser: mockGetUser,
      getQuota: mockGetQuota,
      bumpOcrQuota: mockBumpQuota,
      extractAndMatch: mockExtract,
    });
  });

  it("rejects unauthenticated", async () => {
    mockGetUser.mockResolvedValue(null);
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(401);
  });

  it("returns match result on success", async () => {
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.kind).toBe("match");
    expect(body.problemId).toBe("p1");
    expect(mockBumpQuota).toHaveBeenCalledTimes(1);
  });

  it("returns 402 when free user is at quota", async () => {
    mockGetQuota.mockResolvedValue({ plan: "free", ocrUsedToday: 1 });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(402);
  });

  it("starter plan allows up to 10/day", async () => {
    mockGetQuota.mockResolvedValue({ plan: "starter", ocrUsedToday: 9 });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(200);
  });

  it("starter plan blocks at 10", async () => {
    mockGetQuota.mockResolvedValue({ plan: "starter", ocrUsedToday: 10 });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(402);
  });

  it("pro plan is unlimited", async () => {
    mockGetQuota.mockResolvedValue({ plan: "pro", ocrUsedToday: 9999 });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(200);
  });

  it("rejects missing image", async () => {
    const body = new FormData();
    body.set("locale", "en");
    const r = await POST(new Request("http://localhost/api/problems/ocr", { method: "POST", body }));
    expect(r.status).toBe(400);
  });

  it("rejects oversized image (>5 MB)", async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const r = await POST(makeFormReq({ name: "big.png", type: "image/png", bytes: big }, "en"));
    expect(r.status).toBe(413);
  });

  it("does not bump quota on extraction error", async () => {
    mockExtract.mockResolvedValue({ kind: "error", message: "bad" });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    expect(r.status).toBe(422);
    expect(mockBumpQuota).not.toHaveBeenCalled();
  });

  it("returns fallthrough kind when no confident match", async () => {
    mockExtract.mockResolvedValue({ kind: "fallthrough", statement: "?", topicGuess: null });
    const r = await POST(makeFormReq({ name: "p.png", type: "image/png", bytes: Buffer.from("x") }, "en"));
    const body = await r.json();
    expect(body.kind).toBe("fallthrough");
    expect(mockBumpQuota).toHaveBeenCalled(); // bump even on fallthrough — we paid for the vision call
  });
});
