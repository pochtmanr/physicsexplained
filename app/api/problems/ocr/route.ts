// app/api/problems/ocr/route.ts
import { NextResponse } from "next/server";
import { extractAndMatch, type OcrResult } from "@/lib/problems/ocr";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_OCR_PER_DAY = 1;
const STARTER_OCR_PER_DAY = 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface OcrRouteDeps {
  getUser: () => Promise<{ id: string } | null>;
  getQuota: (userId: string) => Promise<{ plan: string; ocrUsedToday: number }>;
  bumpOcrQuota: (userId: string) => Promise<void>;
  extractAndMatch: typeof extractAndMatch;
}

let deps: OcrRouteDeps = makeDefaultDeps();

function makeDefaultDeps(): OcrRouteDeps {
  return {
    getUser: async () => {
      const ssr = await getSsrClient();
      const { data } = await ssr.auth.getUser();
      return data.user ? { id: data.user.id } : null;
    },
    getQuota: async (userId) => {
      const db = getServiceClient();
      const { data } = await db.from("user_billing")
        .select("plan, problem_ocr_used_today")
        .eq("user_id", userId).maybeSingle();
      return { plan: data?.plan ?? "free", ocrUsedToday: data?.problem_ocr_used_today ?? 0 };
    },
    bumpOcrQuota: async (userId) => {
      const db = getServiceClient();
      await db.rpc("increment_problem_ocr_used_today", { p_user_id: userId });
    },
    extractAndMatch,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _resetOcrRouteDeps(d: Partial<Record<keyof OcrRouteDeps, any>>) {
  deps = { ...makeDefaultDeps(), ...d } as OcrRouteDeps;
}

function quotaLimitFor(plan: string): number | null {
  if (plan === "free") return FREE_OCR_PER_DAY;
  if (plan === "starter") return STARTER_OCR_PER_DAY;
  return null; // pro = unlimited
}

export async function POST(req: Request) {
  const user = await deps.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const file = form.get("image");
  const locale = String(form.get("locale") ?? "en");
  if (!(file instanceof File)) return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });

  const quota = await deps.getQuota(user.id);
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

  await deps.bumpOcrQuota(user.id);
  return NextResponse.json(result);
}
