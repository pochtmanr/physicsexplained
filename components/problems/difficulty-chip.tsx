import clsx from "clsx";
import type { CSSProperties } from "react";
import { Flame, GraduationCap } from "lucide-react";
import { DIFFICULTY_COLOR } from "@/lib/content/difficulty";
import type { ProblemDifficulty } from "@/lib/content/types";

/**
 * The first three levels are steps on one scale, drawn as a three-bar meter
 * with one, two or three bars lit. The last two are different in kind and
 * get their own icon.
 */
const METER_LEVEL: Partial<Record<ProblemDifficulty, 1 | 2 | 3>> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Three rising bars, the first `level` of them lit. */
function LevelMeter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width={12}
      height={12}
      fill="currentColor"
      className="shrink-0"
    >
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={1 + bar * 3.75}
          y={7 - bar * 3}
          width={2.5}
          height={4 + bar * 3}
          rx={0.75}
          opacity={bar < level ? 1 : 0.4}
        />
      ))}
    </svg>
  );
}

function DifficultyIcon({ difficulty }: { difficulty: ProblemDifficulty }) {
  const level = METER_LEVEL[difficulty];
  if (level) return <LevelMeter level={level} />;
  const Icon = difficulty === "exam" ? GraduationCap : Flame;
  return <Icon aria-hidden="true" size={12} strokeWidth={1.8} className="shrink-0" />;
}

export interface DifficultyChipProps {
  difficulty: ProblemDifficulty;
  /** Translated name of the level, e.g. "Easy". */
  label: string;
  className?: string;
}

/**
 * Difficulty of a problem: icon, name and a colour per level. The level is
 * always written out, so colour and icon are never the only cue.
 */
export function DifficultyChip({ difficulty, label, className }: DifficultyChipProps) {
  return (
    <span
      style={{ "--chip": `var(${DIFFICULTY_COLOR[difficulty]})` } as CSSProperties}
      className={clsx(
        "inline-flex items-center gap-1 rounded-[var(--radius-control)] border px-1.5 py-0.5",
        "font-mono text-[10px] uppercase leading-none tracking-wider",
        "border-[color-mix(in_srgb,var(--chip)_45%,transparent)]",
        "bg-[color-mix(in_srgb,var(--chip)_9%,transparent)] text-[var(--chip)]",
        className,
      )}
    >
      <DifficultyIcon difficulty={difficulty} />
      {label}
    </span>
  );
}
