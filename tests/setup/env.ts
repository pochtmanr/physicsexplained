// Load .env / .env.local BEFORE any module imports run during the vitest
// worker boot. Without this, any module that eagerly constructs a Supabase
// client (e.g. `lib/supabase.ts`, transitively imported by `lib/content/*`)
// throws "Missing NEXT_PUBLIC_SUPABASE_URL" at import-time, failing whole
// test suites before a single test runs.
//
// Registered via `test.setupFiles` in `vitest.config.ts`.
import "dotenv/config";
