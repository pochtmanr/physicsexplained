// Load .env / .env.local BEFORE any module imports run during the vitest
// worker boot. Without this, any module that eagerly constructs a Supabase
// client (e.g. `lib/supabase.ts`, transitively imported by `lib/content/*`)
// throws "Missing NEXT_PUBLIC_SUPABASE_URL" at import-time, failing whole
// test suites before a single test runs.
//
// Registered via `test.setupFiles` in `vitest.config.ts`.
import { config } from "dotenv";

config();
config({ path: ".env.local" });

// SEO tests assert canonical production URLs; pin the base URL so a local
// NEXT_PUBLIC_SITE_URL override (e.g. http://localhost:3000) can't leak in.
process.env.NEXT_PUBLIC_SITE_URL = "https://physics.it.com";
