"use client";
import type { FigureContent } from "@/lib/content/blocks";
import { getSimulation } from "@/lib/content/simulation-registry";
import { LazyMount } from "@/components/layout/lazy-mount";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";
import { storageUrl } from "@/lib/supabase";

export function FigureInner({ content }: { content: FigureContent }) {
  if (content.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={storageUrl(content.src)} alt={content.alt} />;
  }
  const Component = getSimulation(content.component);
  // Gate mounting on viewport proximity: otherwise every scene chunk on the
  // essay (plus jsxgraph) downloads and initializes at hydration.
  return (
    <LazyMount fallback={<SceneSkeleton />}>
      <Component {...(content.props ?? {})} />
    </LazyMount>
  );
}
