"use client";
import { useState } from "react";

export interface ProgressStep {
  id: string;
  name: string;
  status: "running" | "ok" | "error";
  args?: Record<string, unknown>;
  preview?: string;
}

const LABELS: Record<string, (args?: Record<string, unknown>) => string> = {
  searchSiteContent: (a) => (a?.q ? `Searching site for “${String(a.q)}”` : "Searching site"),
  getContentEntry: (a) => {
    const slug = a?.slug ? String(a.slug) : "";
    return slug ? `Reading ${slug}` : "Reading article";
  },
  searchGlossary: (a) => (a?.q ? `Searching glossary for “${String(a.q)}”` : "Searching glossary"),
  listGlossaryByCategory: (a) => (a?.category ? `Glossary · ${String(a.category)}` : "Listing glossary terms"),
  searchScenes: (a) => (a?.q ? `Looking for a scene matching “${String(a.q)}”` : "Searching scenes"),
  showScene: (a) => (a?.sceneId ? `Rendering ${String(a.sceneId)}` : "Rendering scene"),
  plotFunction: (a) => (a?.expr ? `Plotting ${String(a.expr)}` : "Plotting"),
  plotParametric: () => "Plotting parametric curve",
  webSearch: (a) => (a?.q ? `Looking up ${String(a.q)}` : "Searching the web"),
  fetchUrl: (a) => (a?.url ? `Fetching ${shortUrl(String(a.url))}` : "Fetching page"),
};

function shortUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./, "") + url.pathname;
  } catch {
    return u;
  }
}

export function ProgressTree({ steps }: { steps: ProgressStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="my-3 space-y-0.5">
      {steps.map((s) => (
        <ProgressRow key={s.id} step={s} />
      ))}
    </div>
  );
}

function ProgressRow({ step }: { step: ProgressStep }) {
  const [open, setOpen] = useState(false);
  const subItems = getSubItems(step);
  const hasSub = subItems.length > 0;
  const label = (LABELS[step.name] ?? ((_a?: Record<string, unknown>) => step.name))(step.args);

  const dim = step.status === "running";
  const errored = step.status === "error";

  return (
    <div>
      <button
        type="button"
        onClick={() => hasSub && setOpen((o) => !o)}
        disabled={!hasSub}
        className={[
          "group flex items-center gap-2 w-full text-left text-[14px] leading-6",
          hasSub ? "cursor-pointer" : "cursor-default",
          errored ? "text-[var(--color-magenta)]" : "text-[var(--color-fg-1)]",
        ].join(" ")}
      >
        <StepIcon name={step.name} status={step.status} />
        <span className={dim ? "opacity-70" : ""}>
          {label}
          {dim && <span className="ml-1 opacity-60">…</span>}
        </span>
        {hasSub && (
          <span
            className={[
              "ml-1 inline-block transition-transform text-[var(--color-fg-3)]",
              open ? "rotate-90" : "rotate-0",
            ].join(" ")}
            aria-hidden
          >
            ›
          </span>
        )}
      </button>
      {hasSub && open && (
        <ul className="ml-7 mt-0.5 mb-1 space-y-0.5">
          {subItems.map((it, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[13px] leading-5 text-[var(--color-fg-2)]"
            >
              <MagnifierIcon />
              <span className="truncate">{it}</span>
            </li>
          ))}
          {step.preview && !subItems.includes(step.preview) && (
            <li className="flex items-center gap-2 text-[13px] leading-5 text-[var(--color-fg-3)]">
              <MagnifierIcon />
              <span className="truncate italic">{step.preview}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function getSubItems(step: ProgressStep): string[] {
  const a = step.args ?? {};
  if (step.name === "webSearch" || step.name === "searchSiteContent" || step.name === "searchGlossary" || step.name === "searchScenes") {
    const q = typeof a.q === "string" ? a.q : "";
    const out: string[] = [];
    if (q) out.push(q);
    if (typeof a.kind === "string") out.push(`kind: ${a.kind}`);
    return out;
  }
  if (step.name === "fetchUrl" && typeof a.url === "string") return [a.url];
  if (step.name === "getContentEntry") {
    const out: string[] = [];
    if (typeof a.kind === "string") out.push(`kind: ${a.kind}`);
    if (typeof a.slug === "string") out.push(`slug: ${a.slug}`);
    return out;
  }
  if (step.name === "listGlossaryByCategory" && typeof a.category === "string") {
    return [a.category];
  }
  if (step.name === "plotFunction") {
    const out: string[] = [];
    if (typeof a.expr === "string") out.push(`y = ${a.expr}`);
    if (typeof a.variable === "string") out.push(`variable: ${a.variable}`);
    return out;
  }
  if (step.name === "plotParametric") {
    const out: string[] = [];
    if (typeof a.x === "string") out.push(`x(t) = ${a.x}`);
    if (typeof a.y === "string") out.push(`y(t) = ${a.y}`);
    return out;
  }
  if (step.name === "showScene" && typeof a.sceneId === "string") return [a.sceneId];
  return [];
}

function StepIcon({ name, status }: { name: string; status: ProgressStep["status"] }) {
  const base = "shrink-0 flex items-center justify-center";
  const dim = status === "running" ? "opacity-70" : "";
  const iconColor =
    status === "error"
      ? "text-[var(--color-magenta)]"
      : status === "ok"
      ? "text-[var(--color-fg-1)]"
      : "text-[var(--color-fg-2)]";
  const cls = `${base} ${dim} ${iconColor}`;
  if (name === "webSearch" || name === "fetchUrl") {
    return (
      <span className={cls} aria-hidden>
        <GlobeIcon />
      </span>
    );
  }
  if (name === "searchSiteContent" || name === "searchGlossary" || name === "searchScenes") {
    return (
      <span className={cls} aria-hidden>
        <SearchIcon />
      </span>
    );
  }
  if (name === "getContentEntry" || name === "listGlossaryByCategory") {
    return (
      <span className={cls} aria-hidden>
        <BookIcon />
      </span>
    );
  }
  if (name === "showScene" || name === "plotFunction" || name === "plotParametric") {
    return (
      <span className={cls} aria-hidden>
        <ChartIcon />
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden>
      <DotIcon />
    </span>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function MagnifierIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-fg-3)] shrink-0">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5V4.5A1.5 1.5 0 0 1 5.5 3H20v18H5.5A1.5 1.5 0 0 1 4 19.5Z" />
      <path d="M4 17.5h16" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-7" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="2.5" fill="currentColor" />
    </svg>
  );
}
