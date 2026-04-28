"use client";
import { useEffect, useState } from "react";

const PROMPTS = [
  "Explain Noether's theorem like I'm 16",
  "Show me a pendulum losing energy to damping",
  "What's the difference between a capacitor and a conductor?",
  "Plot y = sin(x)/x from -10 to 10",
  "Why do planets move in ellipses?",
  "What is isochronism?",
];

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function EmptyState({
  onPick,
  userName,
}: {
  onPick: (q: string) => void;
  userName: string | null;
}) {
  const [greeting, setGreeting] = useState<string>(() => greetingFor(new Date().getHours()));
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <div className="text-center max-w-3xl mx-auto px-4">
      <h1 className="text-2xl md:text-3xl tracking-tight text-[var(--color-fg-0)]">
        {greeting}
        {userName ? (
          <>
            {" "}
            <span className="font-display italic text-[var(--color-cyan)]">
              {userName}
            </span>
          </>
        ) : null}
        , what do you want to learn today?
      </h1>
      <div className="mt-10 hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
        {PROMPTS.map((p, i) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="group relative flex flex-col p-4 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-cyan-dim)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan-dim)_28%,transparent)]"
          >
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
              Example {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-2 text-sm leading-relaxed text-[var(--color-fg-0)] group-hover:text-[var(--color-cyan)] transition-colors">
              {p}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
