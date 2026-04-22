"use client";
import katex from "katex";
import type { JSX } from "react";
import { parseFences, type FencePart } from "@/lib/ask/render";
import { InlineScene } from "./inline-scene";
import { MathPlot } from "./math-plot";
import { Cite } from "./cite";

export function MessageBubble({
  role, text, locale,
}: { role: "user" | "assistant"; text: string; locale: string }) {
  const parts = parseFences(text);
  return (
    <div
      className={`my-3 px-4 py-3 rounded ${
        role === "user" ? "ml-auto max-w-xl bg-muted" : "mr-auto max-w-2xl"
      }`}
    >
      {parts.map((p, i) => renderPart(p, i, locale))}
    </div>
  );
}

function renderPart(p: FencePart, key: number, locale: string): JSX.Element {
  if (p.kind === "text") return <Prose key={key} text={p.text} />;
  if (p.kind === "scene") return <InlineScene key={key} id={p.id} params={p.params} />;
  if (p.kind === "plot") return <MathPlot key={key} args={p.args} />;
  if (p.kind === "cite") return <Cite key={key} kind={p.targetKind} slug={p.slug} locale={locale} />;
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
  return <div className="whitespace-pre-wrap leading-relaxed prose-sm">{nodes}</div>;
}
