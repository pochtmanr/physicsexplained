"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { z } from "zod";
import { decodeState, encodeState, type UrlMode } from "./encode-state";

const WRITE_DEBOUNCE_MS = 250;

export function usePlaygroundState<S extends z.ZodTypeAny>(
  schema: S,
  mode: UrlMode,
): [z.infer<S>, (next: z.infer<S>) => void, () => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => decodeState(new URLSearchParams(searchParams?.toString() ?? ""), schema, mode),
    // Re-decode only when search params identity changes (back/forward navigation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams?.toString()],
  );

  const [state, setStateLocal] = useState<z.infer<S>>(initial);

  // If browser nav changes the URL, hydrate local state from the new URL.
  useEffect(() => {
    setStateLocal(initial);
  }, [initial]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = useCallback(
    (next: z.infer<S>) => {
      setStateLocal(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const sp = encodeState(next, schema, mode);
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, WRITE_DEBOUNCE_MS);
    },
    [router, pathname, schema, mode],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Commit the schema-default state synchronously so consumers (and any
    // resetKey bumped in the same handler) see the defaults in the same React
    // commit. The URL replace below catches up the address bar; we don't want
    // to wait on it because router.replace() is async and the canvas would
    // otherwise rewind against stale state.
    const fresh = decodeState(new URLSearchParams(), schema, mode) as z.infer<S>;
    setStateLocal(fresh);
    router.replace(pathname, { scroll: false });
  }, [router, pathname, schema, mode]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return [state, setState, reset];
}
