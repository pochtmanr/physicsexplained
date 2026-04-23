"use client";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";
import { ProgressTree, type ProgressStep } from "./progress-tree";

interface Props {
  conversationId: string | null;
  message: string;
  locale: string;
  modelId: string;
  onSettled: (convId: string) => void;
  onQuotaExhausted?: (reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due") => void;
}

export function StreamingMessage({ conversationId, message, locale, modelId, onSettled, onQuotaExhausted }: Props) {
  const [text, setText] = useState("");
  const [tools, setTools] = useState<ProgressStep[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firedRef = useRef(false);
  const onSettledRef = useRef(onSettled);
  const onQuotaExhaustedRef = useRef(onQuotaExhausted);
  onSettledRef.current = onSettled;
  onQuotaExhaustedRef.current = onQuotaExhausted;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const ac = new AbortController();
    abortRef.current = ac;
    (async () => {
      try {
        const res = await fetch("/api/ask/stream", {
          method: "POST", signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message, locale, modelId }),
        });
        if (res.status === 402) {
          const body = await res.json().catch(() => ({ reason: "tokens_exhausted" as const }));
          onQuotaExhaustedRef.current?.(body.reason as "free_quota_exhausted" | "tokens_exhausted" | "past_due");
          onSettledRef.current(conversationId ?? "");
          return;
        }
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          setErr(`Error ${res.status}: ${body.slice(0, 200)}`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let resolvedId = conversationId ?? "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const block = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const ev = /^event: (\w[\w-]*)\ndata: (.*)$/m.exec(block);
            if (!ev) continue;
            const [, name, raw] = ev;
            let data: unknown = {};
            try { data = JSON.parse(raw); } catch { data = {}; }
            const d = data as Record<string, unknown>;
            if (name === "meta") resolvedId = (d.conversationId as string) || resolvedId;
            else if (name === "text") setText((t) => t + String(d.delta ?? ""));
            else if (name === "tool-start") {
              const id = String(d.id ?? ""); const n = String(d.name ?? "");
              const args = (d.args as Record<string, unknown> | undefined) ?? undefined;
              setTools((ts) => ts.some((t) => t.id === id) ? ts : [...ts, { id, name: n, status: "running", args }]);
            } else if (name === "tool-args") {
              const id = String(d.id ?? "");
              const args = (d.args as Record<string, unknown> | undefined) ?? undefined;
              setTools((ts) => ts.map((t) => t.id === id ? { ...t, args: args ?? t.args } : t));
            } else if (name === "tool-end") {
              const id = String(d.id ?? ""); const ok = Boolean(d.ok);
              const preview = typeof d.preview === "string" ? d.preview : undefined;
              setTools((ts) => ts.map((t) => t.id === id ? { ...t, status: ok ? "ok" : "error", preview } : t));
            } else if (name === "done") {
              onSettledRef.current(resolvedId);
            } else if (name === "error") {
              setErr(String(d.message ?? "unknown"));
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErr((e as Error).message);
      }
    })();
    return () => ac.abort();
  }, [conversationId, message, locale, modelId]);

  return (
    <div className="mr-auto max-w-2xl">
      {tools.length > 0 && <ProgressTree steps={tools} />}
      {(text || err) && (
        <MessageBubble
          role="assistant"
          text={err ? `${text}\n\nError: ${err}` : text}
          locale={locale}
        />
      )}
      {!text && !err && (
        <div className="my-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          <span>Streaming</span>
          <span className="inline-flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-dim)] animate-pulse [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-dim)] animate-pulse [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-dim)] animate-pulse" />
          </span>
        </div>
      )}
    </div>
  );
}
