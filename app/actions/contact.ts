"use server";

import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";
import { enforceIpRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export interface ContactResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sliding-window rate limit: N messages per IP per window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function submitContactMessage(
  _prevState: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  // Honeypot: a hidden field real users never see. Bots that fill every input
  // trip it. Return a fake success so the bot has no signal to adapt.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true, message: "Thanks — message received. We'll get back to you." };
  }

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
  const ip = getClientIp(h);
  const ipHash = hashIp(ip);
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  // CAPTCHA: verify the Turnstile token before any work. No-ops (allows) if
  // Turnstile is not configured, so the form keeps working pre-rollout.
  const captcha = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip);
  if (!captcha.ok) {
    return { ok: false, message: "Could not verify you're human. Please retry." };
  }

  // Rate limit: count this IP's messages within the sliding window.
  const limit = await enforceIpRateLimit({
    routeKey: "contact",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    ipHash,
  });
  if (!limit.ok) {
    return {
      ok: false,
      message: "Too many messages from your network. Try again later.",
    };
  }

  const supabase = getServerSupabase();

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
