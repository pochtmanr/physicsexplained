"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Forces scrollY=0 on forward pathname changes while letting the browser
 * restore scroll on back/forward. Next.js App Router's default reset can
 * be defeated by streaming + suspense keeping the prior page mounted, so
 * an explicit pathname-change reset makes it deterministic. We deliberately
 * do NOT watch search params here — useSearchParams opts the entire locale
 * subtree out of static rendering, and Next.js Link already scrolls to top
 * on query-only changes by default.
 *
 * popstate → back/forward → skip; let browser restore.
 * First render → skip; user may have landed on a hash fragment.
 */
export function RouteScrollManager() {
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);
  const popstateRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      popstateRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (lastPathname.current === null) {
      lastPathname.current = pathname;
      return;
    }
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;

    if (popstateRef.current) {
      popstateRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
