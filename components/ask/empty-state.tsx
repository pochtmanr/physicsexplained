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
    <div className="text-center space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Ask physics</h1>
      <p className="text-sm text-muted-foreground">
        Grounded in the site's topics, physicists, and glossary.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="text-left text-sm border rounded px-3 py-2 hover:bg-[var(--color-fg-4)]/20 border-[var(--color-fg-4)]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
