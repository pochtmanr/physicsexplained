import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  getSsrClient: vi.fn(),
  getServiceClient: vi.fn(),
}));

import { POST } from "@/app/api/problems/[id]/check/route";
import { _resetCheckRouteDeps } from "@/app/api/problems/[id]/check/route";
import type { Problem } from "@/lib/content/types";

const PROBLEM: Problem = {
  id: "p1",
  primaryTopicSlug: "vectors-and-projectile-motion",
  relatedTopicSlugs: [],
  difficulty: "easy",
  equationSlugs: ["projectile-range"],
  inputs: { v_0: { value: 30, units: "m/s" }, theta: { value: 0.785, units: "rad" } },
  steps: [{
    id: "vx",
    varName: "v_x",
    canonicalExpr: "v_0 * cos(theta)",
    units: "m/s",
    inputDomain: { v_0: [10, 50], theta: [0.1, 1.4] },
    toleranceRel: 1e-6,
  }],
  finalAnswerStepId: "vx",
  solverPath: "lib/problems/classical-mechanics/vectors-and-projectile-motion/p1.ts",
};

const STRINGS = {
  statement: "A ball at v_0 = 30 m/s, theta = 45°.",
  steps: { vx: { prompt: "Find x-velocity.", hint: "Project onto x.", commonMistakes: ["Used sin."] } },
};

function makeReq(body: object): Request {
  return new Request("http://localhost/api/problems/p1/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/problems/[id]/check", () => {
  let mockGetProblem: ReturnType<typeof vi.fn>;
  let mockGetStrings: ReturnType<typeof vi.fn>;
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockGetQuota: ReturnType<typeof vi.fn>;
  let mockBumpQuota: ReturnType<typeof vi.fn>;
  let mockInsertAttempt: ReturnType<typeof vi.fn>;
  let mockDiagnose: ReturnType<typeof vi.fn>;
  let mockInsertDiag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetProblem = vi.fn(() => PROBLEM);
    mockGetStrings = vi.fn(async () => STRINGS);
    mockGetUser = vi.fn(async () => ({ id: "user1" }));
    mockGetQuota = vi.fn(async () => ({ plan: "free", diagnosesUsedToday: 0 }));
    mockBumpQuota = vi.fn(async () => undefined);
    mockInsertAttempt = vi.fn(async () => ({ id: "attempt1" }));
    mockDiagnose = vi.fn(async () => ({ text: "you used sin", cacheKey: "k", cacheHit: false, promptTokens: 100, completionTokens: 30 }));
    mockInsertDiag = vi.fn(async () => undefined);

    _resetCheckRouteDeps({
      getProblem: mockGetProblem,
      getProblemStrings: mockGetStrings,
      getUser: mockGetUser,
      getQuota: mockGetQuota,
      bumpDiagnosesQuota: mockBumpQuota,
      insertAttempt: mockInsertAttempt,
      diagnoseStep: mockDiagnose,
      insertDiagnosis: mockInsertDiag,
    });
  });

  it("anonymous correct: returns verify.ok=true, no attempt logged", async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * cos(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verify.ok).toBe(true);
    expect(body.diagnosis).toBeUndefined();
    expect(body.requiresAuthForDiagnosis).toBeUndefined();
    expect(mockInsertAttempt).not.toHaveBeenCalled();
    expect(mockDiagnose).not.toHaveBeenCalled();
  });

  it("anonymous wrong: returns verify.ok=false + requiresAuthForDiagnosis flag, no diagnosis, no attempt", async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verify.ok).toBe(false);
    expect(body.requiresAuthForDiagnosis).toBe(true);
    expect(body.diagnosis).toBeUndefined();
    expect(mockInsertAttempt).not.toHaveBeenCalled();
    expect(mockDiagnose).not.toHaveBeenCalled();
  });

  it("rejects unknown problem id", async () => {
    mockGetProblem.mockReturnValue(undefined);
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "x", locale: "en" }), { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });

  it("rejects unknown step id", async () => {
    const res = await POST(makeReq({ stepId: "nope", studentExpr: "x", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns ok=true on correct expression without calling diagnoser", async () => {
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * cos(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verify.ok).toBe(true);
    expect(body.diagnosis).toBeUndefined();
    expect(mockDiagnose).not.toHaveBeenCalled();
    expect(mockInsertAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it("calls diagnoser on wrong expression with quota remaining", async () => {
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verify.ok).toBe(false);
    expect(body.diagnosis).toBe("you used sin");
    expect(mockDiagnose).toHaveBeenCalledTimes(1);
    expect(mockBumpQuota).toHaveBeenCalledTimes(1);
  });

  it("does NOT bump quota when diagnosis is a cache hit", async () => {
    mockDiagnose.mockResolvedValueOnce({ text: "cached prose", cacheKey: "k", cacheHit: true, promptTokens: 100, completionTokens: 30 });
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(body.diagnosis).toBe("cached prose");
    expect(mockBumpQuota).not.toHaveBeenCalled();
  });

  it("returns quotaExhausted=true on free user past 5 wrong-step diagnoses", async () => {
    mockGetQuota.mockResolvedValue({ plan: "free", diagnosesUsedToday: 5 });
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(body.verify.ok).toBe(false);
    expect(body.quotaExhausted).toBe(true);
    expect(body.diagnosis).toBeUndefined();
    expect(mockDiagnose).not.toHaveBeenCalled();
  });

  it("paid users have unlimited diagnoses", async () => {
    mockGetQuota.mockResolvedValue({ plan: "starter", diagnosesUsedToday: 999 });
    const res = await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    const body = await res.json();
    expect(body.diagnosis).toBe("you used sin");
    expect(body.quotaExhausted).toBeUndefined();
  });

  it("rejects malformed body", async () => {
    const res = await POST(new Request("http://localhost/api/problems/p1/check", { method: "POST", body: "not json" }), { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("inserts a problem_diagnoses row when diagnosis runs", async () => {
    await POST(makeReq({ stepId: "vx", studentExpr: "v_0 * sin(theta)", locale: "en" }), { params: Promise.resolve({ id: "p1" }) });
    expect(mockInsertDiag).toHaveBeenCalledWith({ attemptId: "attempt1", cacheKey: "k", cacheHit: false });
  });
});
