"use client";
const PROMPTS = [
  "Explain Noether's theorem like I'm 16",
  "Show me a pendulum losing energy to damping",
  "What's the difference between a capacitor and a conductor?",
  "Plot y = sin(x)/x from -10 to 10",
  "Why do planets move in ellipses?",
  "What is isochronism?",
];

export function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="text-center max-w-3xl mx-auto px-4">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        Ask Physics
      </div>
      <h1 className="mt-4 text-3xl md:text-4xl tracking-tight text-[var(--color-fg-0)]">
        What do you want to{" "}
        <span className="font-display italic text-[var(--color-cyan)]">
          understand
        </span>
        ?
      </h1>
      <p className="mt-4 text-sm md:text-base text-[var(--color-fg-1)] max-w-[60ch] mx-auto">
        Grounded in this site's topics, physicists, and glossary.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
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
