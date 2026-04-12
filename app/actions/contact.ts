"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { getServerSupabase } from "@/lib/supabase/server";

export interface ContactResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple sliding-window rate limit: N messages per IP per window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Hash client IP with a secret pepper. The raw IP never touches the DB —
 * we store only the hash so we can rate-limit abusers without retaining PII.
 */
function hashIp(ip: string): string {
  const pepper = process.env.CONTACT_IP_PEPPER;
  if (!pepper) {
    throw new Error("CONTACT_IP_PEPPER is not set");
  }
  return createHash("sha256").update(`${pepper}|${ip}`).digest("hex");
}

function getClientIp(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitContactMessage(
  _prevState: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || name.length > 200) {
    return { ok: false, message: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, message: "Please enter a valid email." };
  }
  if (message.length < 10 || message.length > 5000) {
    return { ok: false, message: "Message must be between 10 and 5000 characters." };
  }

  const h = await headers();
  const ipHash = hashIp(getClientIp(h));
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  const supabase = getServerSupabase();

  // Rate limit: count this IP's messages within the sliding window.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("[contact] rate-limit check failed:", countError);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      message: "Too many messages from your network. Try again later.",
    };
  }

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    message,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("[contact] insert failed:", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return {
    ok: true,
    message: "Thanks — message received. We'll get back to you.",
  };
}
