// app/api/problems/ocr/deps.ts
//
// DI seam for the OCR route, kept in a sibling module because Next.js
// route files may only export the route handler + a small allowlist of
// config fields. Tests reset deps via _resetOcrRouteDeps.
import { extractAndMatch } from "@/lib/problems/ocr";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";

export interface OcrRouteDeps {
  getUser: () => Promise<{ id: string } | null>;
  getQuota: (userId: string) => Promise<{ plan: string; ocrUsedToday: number }>;
  bumpOcrQuota: (userId: string) => Promise<void>;
  extractAndMatch: typeof extractAndMatch;
}

export function makeDefaultDeps(): OcrRouteDeps {
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

let deps: OcrRouteDeps = makeDefaultDeps();

export function getOcrRouteDeps(): OcrRouteDeps {
  return deps;
}

export function _resetOcrRouteDeps(d: Partial<OcrRouteDeps> = {}) {
  deps = { ...makeDefaultDeps(), ...d };
}
