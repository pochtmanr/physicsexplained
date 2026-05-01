import type { ComponentType } from "react";
import type { z } from "zod";
import type { UrlMode } from "./encode-state";
import { orbitalSchema } from "@/components/playgrounds/orbital-mechanics/schema";

export interface PlaygroundMeta<S extends z.ZodTypeAny = z.ZodTypeAny> {
  slug: string;
  /** Translation key for the title (under `play.<slug>.title`) */
  titleKey: string;
  /** Translation key for the AI starter prompt (under `play.<slug>.aiPrompt`) */
  aiPromptKey: string;
  /** Scene id used in the simulation registry + scene catalog */
  sceneId: string;
  schema: S;
  urlMode: UrlMode;
  /** Show a BETA badge in the playground header */
  beta?: boolean;
  /** The actual playground component, lazily loaded */
  loader: () => Promise<{ default: ComponentType }>;
}

export const PLAYGROUNDS: Record<string, PlaygroundMeta> = {
  "orbital-mechanics": {
    slug: "orbital-mechanics",
    titleKey: "play.orbital-mechanics.title",
    aiPromptKey: "play.orbital-mechanics.aiPrompt",
    sceneId: "OrbitalMechanicsPlayground",
    schema: orbitalSchema,
    urlMode: "blob",
    beta: true,
    loader: () =>
      import("@/components/playgrounds/orbital-mechanics").then((m) => ({
        default: (m as { OrbitalMechanicsPlayground: ComponentType }).OrbitalMechanicsPlayground,
      })),
  },
};

export function getPlayground(slug: string): PlaygroundMeta | undefined {
  return PLAYGROUNDS[slug];
}

export const PLAYGROUND_SLUGS = Object.keys(PLAYGROUNDS);
