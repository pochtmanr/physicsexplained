"use server";

import { getServerSupabase } from "@/lib/supabase/server";

export interface SignupResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupForBranchUpdates(
  _prevState: SignupResult | null,
  formData: FormData,
): Promise<SignupResult> {
  const branchSlug = String(formData.get("branchSlug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!branchSlug || branchSlug.length > 80) {
    return { ok: false, message: "Missing branch reference." };
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, message: "Please enter a valid email." };
  }

  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("email_signups")
    .insert({ email, branch_slug: branchSlug });

  if (error) {
    // 23505 = unique_violation on (email, branch_slug)
    if (error.code === "23505") {
      return {
        ok: true,
        message: "You're already on the list — we'll email you when this branch goes live.",
      };
    }
    console.error("[email-signup] insert failed:", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return {
    ok: true,
    message: "Thanks — we'll email you when this branch goes live.",
  };
}
