"use client";
import katex from "katex";
import { lazy, Suspense, type JSX } from "react";
import { parseFences, type FencePart } from "@/lib/ask/render";
import { Cite } from "./cite";
import { FurtherReading } from "./further-reading";

// Heavy renderers (jsxgraph, mathjs, full simulation registry) are split out of
// the message bundle so the initial paint of a streamed answer doesn't wait on
// hundreds of KB of visualization code. Placeholders below mimic the final
// footprint to avoid layout shift when the real component hydrates.
const InlineScene = lazy(() => import("./inline-scene").then((m) => ({ default: m.InlineScene })));
const MathPlot = lazy(() => import("./math-plot").then((m) => ({ default: m.MathPlot })));

function ScenePlaceholder() {
  return (
    <div className="my-3 border rounded p-2 h-[220px] animate-pulse bg-[var(--color-fg-4)]/10" aria-label="Loading scene…" />
  );
}
function PlotPlaceholder() {
  return (
    <div className="my-4 border rounded p-2 h-72 animate-pulse bg-[var(--color-fg-4)]/10" aria-label="Loading plot…" />
  );
}

export function MessageBubble({
  role, text, locale,
}: { role: "user" | "assistant"; text: string; locale: string }) {
  const parts = parseFences(text);
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="my-3 ml-auto max-w-xl bg-[var(--color-fg-4)]/35 border-l-2 border-[var(--color-cyan-dim)]/60 px-4 py-3">
        {parts.map((p, i) => renderPart(p, i, locale))}
      </div>
    );
  }

  const glossarySlugs = Array.from(
    new Set(
      parts
        .filter((p): p is Extract<FencePart, { kind: "cite" }> => p.kind === "cite" && p.targetKind === "glossary")
        .map((p) => p.slug),
    ),
  );

  return (
    <div className="my-4 mr-auto max-w-2xl">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-1.5">
        Physics.AI
      </div>
      <div className="text-[var(--color-fg-0)]">
        {parts.map((p, i) => renderPart(p, i, locale))}
      </div>
      {glossarySlugs.length > 0 && <FurtherReading slugs={glossarySlugs} locale={locale} />}
    </div>
  );
}

function renderPart(p: FencePart, key: number, locale: string): JSX.Element {
  if (p.kind === "text") return <Prose key={key} text={p.text} />;
  if (p.kind === "scene") {
    return (
      <Suspense key={key} fallback={<ScenePlaceholder />}>
        <InlineScene id={p.id} params={p.params} />
      </Suspense>
    );
  }
  if (p.kind === "plot") {
    return (
      <Suspense key={key} fallback={<PlotPlaceholder />}>
        <MathPlot args={p.args} />
      </Suspense>
    );
  }
  if (p.kind === "cite") {
    // Glossary citations surface as rich cards in <FurtherReading/> below the
    // message — skip the inline chip so it doesn't duplicate.
    if (p.targetKind === "glossary") return <span key={key} />;
    return <Cite key={key} kind={p.targetKind} slug={p.slug} locale={locale} />;
  }
  return <span key={key} />;
}

function Prose({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(<span key={`t${i++}`}>{text.slice(last, m.index)}</span>);
    const display = m[0].startsWith("$$");
    const tex = m[0].replace(/^\$+|\$+$/g, "");
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: false });
    nodes.push(<span key={`m${i++}`} dangerouslySetInnerHTML={{ __html: html }} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(<span key={`t${i++}`}>{text.slice(last)}</span>);
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-[var(--color-fg-0)] text-[15px]">
      {nodes}
    </div>
  );
}
