"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSsrClient } from "@/lib/supabase-server";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/");
  if (!email) return { error: "Email required" };

  const db = await getSsrClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signInWithGoogle(next: string) {
  const db = await getSsrClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
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
