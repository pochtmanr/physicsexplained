// app/api/problems/ocr/route.ts
import { NextResponse } from "next/server";
import type { OcrResult } from "@/lib/problems/ocr";
import { getOcrRouteDeps } from "./deps";
import { enforceIpRateLimit, getClientIp } from "@/lib/rate-limit";
import { acquireStreamSlot } from "@/lib/ask/stream-lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_OCR_PER_DAY = 1;
const STARTER_OCR_PER_DAY = 10;
const MAX_BYTES = 5 * 1024 * 1024;

function quotaLimitFor(plan: string): number | null {
  if (plan === "free") return FREE_OCR_PER_DAY;
  if (plan === "starter") return STARTER_OCR_PER_DAY;
  return null; // pro = unlimited
}

export async function POST(req: Request) {
  const deps = getOcrRouteDeps();
  const user = await deps.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  // Per-IP cap on top of the per-user daily quota: blunts a farm of accounts
  // behind one IP from multiplying expensive vision-API calls.
  const ipLimit = await enforceIpRateLimit({
    routeKey: "problems:ocr",
    max: 10,
    windowMs: 60 * 60 * 1000,
    ip: getClientIp(req.headers),
  });
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "retry-after": String(ipLimit.retryAfterSeconds) } },
    );
  }

  // Refuse an oversized upload before reading it into memory. The multipart
  // envelope adds a little to the image itself, hence the margin.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
  }

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const file = form.get("image");
  const locale = String(form.get("locale") ?? "en");
  if (!(file instanceof File)) return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });

  // One OCR per user at a time: the daily quota is read here and bumped after
  // the vision call, so parallel uploads would otherwise all pass the same read.
  const release = await acquireStreamSlot(`ocr:${user.id}`, 0);
  if (!release) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  try {
    return await runOcr(file, locale, user.id);
  } finally {
    release();
  }
}

async function runOcr(file: File, locale: string, userId: string) {
  const deps = getOcrRouteDeps();
  const quota = await deps.getQuota(userId);
  const limit = quotaLimitFor(quota.plan);
  if (limit !== null && quota.ocrUsedToday >= limit) {
    return NextResponse.json({ error: "QUOTA_EXHAUSTED" }, { status: 402 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let result: OcrResult;
  try {
    result = await deps.extractAndMatch({ imageBytes: bytes, mimeType: file.type, locale });
  } catch (e) {
    return NextResponse.json({ error: "OCR_FAILED", message: (e as Error).message }, { status: 500 });
  }

  if (result.kind === "error") {
    return NextResponse.json(result, { status: 422 });
  }

  await deps.bumpOcrQuota(userId);
  return NextResponse.json(result);
}
