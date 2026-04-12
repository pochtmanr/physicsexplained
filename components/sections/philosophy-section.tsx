import { WIDE_CONTAINER } from "@/lib/layout";

interface Rule {
  label: string;
  title: string;
  body: string;
}

const RULES: readonly Rule[] = [
  {
    label: "01 · ACCURACY",
    title: "Real math, not cartoons.",
    body: "Every animation is driven by a unit-tested physics solver — odex for ODEs, Newton-Raphson for Kepler's equation, analytic solutions where they exist. If a number appears on screen, it's correct to at least three decimals.",
  },
  {
    label: "02 · INTUITION",
    title: "Feel it before you prove it.",
    body: "We show you the idea first, with moving pictures, and the math second. No formulas without a picture. No picture without the math underneath.",
  },
  {
    label: "03 · OPEN",
    title: "Free and open source.",
    body: "Every line of code, every equation, every solver — open source. Fork it, embed it, improve it. Society gets smarter when physics gets easier.",
  },
];

export function PhilosophySection() {
  return (
    <section className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        § HOW WE TEACH
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
        Three rules for every topic.
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {RULES.map((rule) => (
          <div
            key={rule.label}
            className="border-l border-[var(--color-fg-3)] pl-6"
          >
            <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
              {rule.label}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-[var(--color-fg-0)]">
              {rule.title}
            </h3>
            <p className="mt-3 text-[var(--color-fg-1)]">{rule.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
