"use server";

import { getServerSupabase } from "@/lib/supabase/server";

export interface NewsletterResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(
  _prevState: NewsletterResult | null,
  formData: FormData,
): Promise<NewsletterResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, message: "Please enter a valid email." };
  }

  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error) {
    // 23505 = unique_violation on email
    if (error.code === "23505") {
      return { ok: true, message: "You're already subscribed." };
    }
    console.error("[newsletter] insert failed:", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "You're in — welcome aboard." };
}
