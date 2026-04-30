import { z } from "zod";

export type UrlMode = "params" | "blob";

function toUrlSafeBase64(s: string): string {
  // Browser-safe base64 with URL-safe alphabet (no padding).
  const b64 = typeof window === "undefined"
    ? Buffer.from(s, "utf-8").toString("base64")
    : window.btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(s: string): string {
  // Accept both URL-safe (-, _) and standard (+, /) inputs.
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const full = pad ? padded + "=".repeat(4 - pad) : padded;
  return typeof window === "undefined"
    ? Buffer.from(full, "base64").toString("utf-8")
    : decodeURIComponent(escape(window.atob(full)));
}

export function encodeState<S extends z.ZodTypeAny>(
  state: z.infer<S>,
  _schema: S,
  mode: UrlMode,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (mode === "blob") {
    sp.set("s", toUrlSafeBase64(JSON.stringify(state)));
    return sp;
  }
  // params mode — set every defined primitive
  for (const [k, v] of Object.entries(state as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") {
      // Nested objects in params mode: stringify under the key (rare).
      sp.set(k, toUrlSafeBase64(JSON.stringify(v)));
    } else {
      sp.set(k, String(v));
    }
  }
  return sp;
}

export function decodeState<S extends z.ZodTypeAny>(
  sp: URLSearchParams,
  schema: S,
  mode: UrlMode,
): z.infer<S> {
  if (mode === "blob") {
    const raw = sp.get("s");
    if (!raw) return schema.parse({}) as z.infer<S>;
    try {
      const json = JSON.parse(fromUrlSafeBase64(raw));
      const parsed = schema.safeParse(json);
      if (parsed.success) return parsed.data;
    } catch {
      // fallthrough to defaults
    }
    return schema.parse({}) as z.infer<S>;
  }

  // params mode — best-effort coerce strings to the schema's expected types.
  const raw: Record<string, unknown> = {};
  sp.forEach((value, key) => {
    if (value === "true") raw[key] = true;
    else if (value === "false") raw[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) raw[key] = Number(value);
    else raw[key] = value;
  });
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : (schema.parse({}) as z.infer<S>);
}
