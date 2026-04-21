"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";

interface Rule {
  label: string;
  title: string;
  body: string;
  cta?: string;
}

interface PhilosophyCardsProps {
  rules: readonly Rule[];
}

const NEWTON_HREF = "/classical-mechanics/newtons-three-laws";
const GITHUB_HREF = "https://github.com/pochtmanr/physicsexplained";

// Graded depth — each card sinks a little deeper than the one before it.
// First card stays on the page background; the third is darkest, with the
// strongest cyan undertone and a denser grid wash.
const TINTS = [
  { darkPct: 0, cyanPct: 2, gridOpacity: 0.5 },
  { darkPct: 45, cyanPct: 5, gridOpacity: 0.75 },
  { darkPct: 85, cyanPct: 9, gridOpacity: 1 },
] as const;

export function PhilosophyCards({ rules }: PhilosophyCardsProps) {
  return (
    <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
      {rules.map((rule, i) => {
        const tint = TINTS[i] ?? TINTS[TINTS.length - 1];
        const number = String(i + 1).padStart(2, "0");
        const href = i === 1 ? NEWTON_HREF : i === 2 ? GITHUB_HREF : undefined;
        const external = i === 2;

        return (
          <motion.div
            key={rule.label}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: i * 0.09,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <RuleCard
              rule={rule}
              number={number}
              href={href}
              external={external}
              tint={tint}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

interface RuleCardProps {
  rule: Rule;
  number: string;
  href?: string;
  external: boolean;
  tint: (typeof TINTS)[number];
}

function RuleCard({ rule, number, href, external, tint }: RuleCardProps) {
  const background = `color-mix(in srgb, var(--color-cyan) ${tint.cyanPct}%, color-mix(in srgb, var(--color-bg-0) ${tint.darkPct}%, var(--color-bg-1)))`;

  const style = {
    background,
    "--card-grid-opacity": String(tint.gridOpacity),
  } as CSSProperties;

  const className = [
    "group relative flex h-full min-h-[280px] flex-col overflow-hidden",
    "border border-[var(--color-fg-4)] p-6 md:p-8",
    "transition-[border-color,box-shadow] duration-[280ms] ease-out",
    "hover:z-10 hover:border-[var(--color-cyan)]",
    "hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan)_35%,transparent),0_24px_56px_-20px_color-mix(in_srgb,var(--color-cyan)_45%,transparent)]",
    href ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body: ReactNode = (
    <>
      {/* Grid wash — density grows with card depth */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: "var(--card-grid-opacity)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 70%)",
        }}
      />

      {/* Giant watermark numeral */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -end-2 select-none font-display text-[128px] md:text-[176px] leading-none font-semibold text-[var(--color-cyan)] opacity-[0.05] transition-all duration-[400ms] ease-out group-hover:opacity-[0.12] group-hover:-translate-y-1 rtl:-end-auto rtl:-start-2"
      >
        {number}
      </span>

      {/* Label */}
      <div className="relative font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        {rule.label}
      </div>

      {/* Title */}
      <h3 className="relative mt-4 text-xl md:text-2xl text-[var(--color-fg-0)] transition-colors duration-[240ms] group-hover:text-[var(--color-cyan)]">
        {rule.title}
      </h3>

      {/* Body */}
      <p className="relative mt-3 text-sm md:text-base text-[var(--color-fg-1)]">{rule.body}</p>

      {/* Action row — only on cards 2 & 3 */}
      {rule.cta ? (
        <div className="relative mt-auto flex items-center gap-2 pt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
          {external ? (
            <span
              aria-hidden="true"
              className="text-[var(--color-amber)] transition-transform duration-[320ms] ease-out group-hover:rotate-[20deg] group-hover:scale-110"
            >
              ★
            </span>
          ) : null}
          <span>{rule.cta}</span>
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-[240ms] ease-out group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          >
            {external ? "↗" : "→"}
          </span>
        </div>
      ) : (
        <div className="relative mt-auto flex flex-wrap gap-2 pt-8 font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
          <TechChip>odex</TechChip>
          <TechChip>Newton-Raphson</TechChip>
          <TechChip>analytic</TechChip>
        </div>
      )}
    </>
  );

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={style}
      >
        {body}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

function TechChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block border border-[var(--color-fg-4)] px-2 py-1 transition-colors duration-[200ms] group-hover:border-[var(--color-cyan)] group-hover:text-[var(--color-cyan)]">
      {children}
    </span>
  );
}
