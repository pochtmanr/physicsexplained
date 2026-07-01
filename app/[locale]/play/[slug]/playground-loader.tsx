"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";
import { getPlayground } from "../_components/playground-meta";

/**
 * Resolves the playground component from the registry (playground-meta.ts),
 * honoring the framework promise that adding a playground touches no
 * framework code. Loader closures use static import() calls, so per-
 * playground chunk splitting survives.
 */
export function PlaygroundLoader({ slug }: { slug: string }) {
  const meta = getPlayground(slug);
  const Component = useMemo(
    () =>
      meta
        ? dynamic(meta.loader, { ssr: false, loading: () => <SceneSkeleton /> })
        : null,
    // meta is a registry constant per slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug],
  );
  if (!Component) return null;
  return <Component />;
}
