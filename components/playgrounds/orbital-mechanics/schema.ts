import { z } from "zod";
import { PRESET_IDS } from "./presets";

export const bodySchema = z.object({
  id: z.string(),
  mass: z.number().positive(),
  x: z.number(),
  y: z.number(),
  vx: z.number(),
  vy: z.number(),
});

export const orbitalSchema = z.object({
  preset: z.enum(["figure-8", "solar-mini", "pythagorean", "random-cluster", "custom"])
    .default("figure-8"),
  bodies: z.array(bodySchema).default([]),
  trails: z.boolean().default(true),
  speed: z.union([z.literal(0.25), z.literal(1), z.literal(4)]).default(1),
});

export type OrbitalState = z.infer<typeof orbitalSchema>;
export const ORBITAL_PRESET_IDS = PRESET_IDS;
