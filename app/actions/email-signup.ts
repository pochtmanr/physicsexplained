"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { enforceIpRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export interface SignupResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP sliding window: cap signups to slow down email-list harvesting.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function signupForBranchUpdates(
  _prevState: SignupResult | null,
  formData: FormData,
): Promise<SignupResult> {
  const t = await getTranslations("home.emailSignup.status");

  // Honeypot: bots fill hidden fields. Fake success to avoid giving a signal.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true, message: t("success") };
  }

  const branchSlug = String(formData.get("branchSlug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!branchSlug || branchSlug.length > 80) {
    return { ok: false, message: t("missingBranch") };
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, message: t("invalidEmail") };
  }

  const h = await headers();
  const ip = getClientIp(h);

  const captcha = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip);
  if (!captcha.ok) {
    return { ok: false, message: t("error") };
  }

  const limit = await enforceIpRateLimit({
    routeKey: "email-signup",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    ip,
  });
  if (!limit.ok) {
    return { ok: false, message: t("error") };
  }

  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("email_signups")
    .insert({ email, branch_slug: branchSlug });

  if (error) {
    // 23505 = unique_violation on (email, branch_slug)
    if (error.code === "23505") {
      return { ok: true, message: t("alreadySignedUp") };
    }
    console.error("[email-signup] insert failed:", error);
    return { ok: false, message: t("error") };
  }

  return { ok: true, message: t("success") };
}
