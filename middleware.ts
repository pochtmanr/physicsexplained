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
  const res = intl(req);

  if (PROTECTED.test(req.nextUrl.pathname) && !hasSupabaseCookie(req)) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const locale = /^\/([a-z]{2})\//.exec(req.nextUrl.pathname)?.[1] ?? "en";
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.searchParams.set("next", req.nextUrl.pathname);
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
