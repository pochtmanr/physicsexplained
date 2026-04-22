// lib/supabase-server.ts
// Two clients:
//   - getServiceClient(): service-role bypass (CLI + API routes that insert tutor data)
//   - getSsrClient(): RSC-friendly client that reads session from cookies
// NEVER import getServiceClient from app/ or components/ that reaches a client bundle.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
