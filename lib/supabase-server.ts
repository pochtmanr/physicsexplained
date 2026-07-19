// lib/supabase-server.ts
// Three clients:
//   - getServiceClient(): service-role bypass (CLI + API routes that insert tutor data)
//   - getSsrClient(): RSC-friendly client that reads session from cookies
//   - getRequestClient(req): API-route caller resolution — bearer JWT or cookies
// NEVER import getServiceClient from app/ or components/ that reaches a client bundle.
import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

let _service: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_service) return _service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  _service = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

export async function getSsrClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env");
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // In a pure Server Component we can't set cookies; middleware will refresh the session.
        }
      },
    },
  });
}

/**
 * Resolves the caller in an API route. Native clients (iOS) send
 * `Authorization: Bearer <supabase access_token>`; browsers use SSR cookies.
 *
 * Returns an RLS-scoped client — queries run AS the user, exactly as the cookie
 * path already did — plus the resolved user, or null when the credential is
 * missing, malformed, or expired. Callers must 401 on a null user; a bearer
 * header alone proves nothing (middleware only presence-checks it).
 *
 * The cookie branch is byte-for-byte the previous behavior; bearer is additive.
 */
export async function getRequestClient(
  req: Request,
): Promise<{ db: SupabaseClient; user: User | null }> {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice("Bearer ".length);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("Missing Supabase env");

    const db = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Forwarding the JWT makes PostgREST evaluate RLS as this user.
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    // Validates signature + expiry against Supabase Auth. A malformed token can
    // reject rather than resolve, and callers translate a null user into 401 —
    // so swallow it here to keep garbage bearers a 401 and not a 500.
    try {
      const { data } = await db.auth.getUser(jwt);
      return { db, user: data.user };
    } catch {
      return { db, user: null };
    }
  }

  const db = await getSsrClient();
  const { data } = await db.auth.getUser();
  return { db, user: data.user };
}
