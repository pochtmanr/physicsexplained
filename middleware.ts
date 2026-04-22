import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

// Paths that require auth. Real session validation runs in the route handler /
// Server Component via getSsrClient(); middleware only does a lightweight
// presence-check on any Supabase auth cookie so we can redirect unauth'd users.
const PROTECTED = /^\/(?:[a-z]{2}\/)?(?:ask|account)(?:\/|$)|^\/api\/ask(?:\/|$)/;

function hasSupabaseCookie(req: NextRequest): boolean {
  // @supabase/ssr stores tokens in cookies named like `sb-<project-ref>-auth-token`.
  return req.cookies.getAll().some((c) => /^sb-.+-auth-token(\.|$)/.test(c.name));
}

export default async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Pass through auth callback + API routes untouched — next-intl must not
  // rewrite these. API-route auth is enforced by the protected block below.
  if (p.startsWith("/auth/") || p.startsWith("/api/")) {
    if (PROTECTED.test(p) && !hasSupabaseCookie(req)) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const res = intl(req);

  if (PROTECTED.test(p) && !hasSupabaseCookie(req)) {
    const locale = /^\/([a-z]{2})\//.exec(p)?.[1] ?? "en";
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.searchParams.set("next", p);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next|favicon\\.ico|icon-.*\\.png|apple-icon\\.png|images|fonts|.*\\..*).*)",
    "/api/ask/:path*",
  ],
};
