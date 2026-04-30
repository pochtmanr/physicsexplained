"use client";

import dynamic from "next/dynamic";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";

const OrbitalPlayground = dynamic(
  () =>
    import("@/components/playgrounds/orbital-mechanics").then((m) => ({
      default: m.OrbitalMechanicsPlayground,
    })),
  { ssr: false, loading: () => <SceneSkeleton /> },
);

export function PlaygroundLoader({ slug }: { slug: string }) {
  switch (slug) {
    case "orbital-mechanics":
      return <OrbitalPlayground />;
    default:
      return null;
  }
}
