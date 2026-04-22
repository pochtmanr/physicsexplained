"use client";
import { Component, type ReactNode } from "react";
import { SIMULATION_REGISTRY } from "@/lib/content/simulation-registry";

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

export function InlineScene({ id, params }: { id: string; params: Record<string, unknown> }) {
  const Comp = SIMULATION_REGISTRY[id];
  if (!Comp) return <div className="text-xs text-muted-foreground">Unknown scene: {id}</div>;
  return (
    <Boundary>
      <div className="my-3 border rounded p-2"><Comp {...params} /></div>
    </Boundary>
  );
}
