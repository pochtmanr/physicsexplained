"use client";
import type { FigureContent } from "@/lib/content/blocks";
import { getSimulation } from "@/lib/content/simulation-registry";
import { storageUrl } from "@/lib/supabase";

export function FigureInner({ content }: { content: FigureContent }) {
  if (content.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={storageUrl(content.src)} alt={content.alt} />;
  }
  const Component = getSimulation(content.component);
  return <Component {...(content.props ?? {})} />;
}
