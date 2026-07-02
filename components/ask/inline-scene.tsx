"use client";
import Link from "next/link";
import { Component, type ReactNode } from "react";
import { SIMULATION_REGISTRY } from "@/lib/content/simulation-registry";
import { SceneCard } from "@/components/layout/scene-card";
import { GENERATED_SCENE_META } from "@/lib/ask/scene-meta.generated";

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs">Scene failed to render.</div>;
    }
    return this.props.children;
  }
}

export function InlineScene({
  id, params, locale = "en",
}: { id: string; params: Record<string, unknown>; locale?: string }) {
  const Comp = SIMULATION_REGISTRY[id];
  if (!Comp) return <div className="text-xs text-muted-foreground">Unknown scene: {id}</div>;
  const meta = GENERATED_SCENE_META[id];
  // Models may write a bare fence (no params) for catalog scenes — fall back
  // to the props the scene's own essay passes it, so both paths render alike.
  const effectiveParams = Object.keys(params).length ? params : (meta?.defaultProps ?? {});
  const caption = meta
    ? meta.figLabel ? `${meta.figLabel} — ${meta.caption}` : meta.caption
    : undefined;
  return (
    <Boundary>
      <div className="my-4 w-full">
        {/* my-4! — SceneCard's essay default is my-16, far too airy for chat. */}
        <SceneCard caption={caption} className="my-0! w-full">
          <Comp {...effectiveParams} />
        </SceneCard>
        {meta?.topicSlug && (
          <div className="mt-1.5 text-right">
            <Link
              href={`/${locale}/${meta.topicSlug}`}
              className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:text-[var(--color-fg-0)]"
            >
              View in essay →
            </Link>
          </div>
        )}
      </div>
    </Boundary>
  );
}
