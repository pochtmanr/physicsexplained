"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSsrClient } from "@/lib/supabase-server";
import { safeNextPath } from "@/lib/auth/safe-next";
import { SITE } from "@/lib/seo/config";

/**
 * Origin the auth provider sends the browser back to. The request's Origin
 * header is caller-controlled, so production always uses the configured site
 * URL; the header is honoured only in development (localhost, LAN devices).
 */
async function callbackOrigin(): Promise<string> {
  const site = new URL(SITE.baseUrl).origin;
  if (process.env.NODE_ENV === "production") return site;
  return (await headers()).get("origin") ?? site;
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const origin = await callbackOrigin();
  const next = safeNextPath(String(formData.get("next") ?? "/"), origin);
  // Cloudflare Turnstile token. Supabase Auth verifies it server-side when
  // CAPTCHA is enabled in the dashboard; harmless (ignored) until then.
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "") || undefined;
  if (!email) return { error: "Email required" };

  const db = await getSsrClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      captchaToken,
    },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signInWithGoogle(rawNext: string) {
  const db = await getSsrClient();
  const origin = await callbackOrigin();
  const next = safeNextPath(rawNext, origin);
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  if (data?.url) redirect(data.url);
}

export async function signOut() {
  const db = await getSsrClient();
  await db.auth.signOut();
  redirect("/");
}
