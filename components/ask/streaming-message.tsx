"use client";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";
import { ProgressTree, ThinkingChip, type ProgressStep } from "./progress-tree";

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
  const startedAtRef = useRef<number>(Date.now());
  const onSettledRef = useRef(onSettled);
  const onQuotaExhaustedRef = useRef(onQuotaExhausted);
  onSettledRef.current = onSettled;
  onQuotaExhaustedRef.current = onQuotaExhausted;

  // Do NOT guard with a "firedRef" — React strict mode in dev mounts → cleans
  // up → remounts, and a firedRef guard would let the cleanup abort the first
  // fetch while permanently blocking the second mount from retrying. Result:
  // silent spinner forever (no response, no error — because AbortError is
  // swallowed below). The route has its own 10s dedup (see app/api/ask/stream
  // /route.ts "Dedup") so strict-mode double-mount is server-safe: the second
  // request sees the first conversation and reuses it.
  useEffect(() => {
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
              const now = Date.now();
              setTools((ts) => ts.some((t) => t.id === id) ? ts : [...ts, { id, name: n, status: "running", args, startedAt: now }]);
            } else if (name === "tool-args") {
              const id = String(d.id ?? "");
              const args = (d.args as Record<string, unknown> | undefined) ?? undefined;
              setTools((ts) => ts.map((t) => t.id === id ? { ...t, args: args ?? t.args } : t));
            } else if (name === "tool-end") {
              const id = String(d.id ?? ""); const ok = Boolean(d.ok);
              const preview = typeof d.preview === "string" ? d.preview : undefined;
              const now = Date.now();
              setTools((ts) => ts.map((t) => t.id === id ? { ...t, status: ok ? "ok" : "error", preview, endedAt: now } : t));
            } else if (name === "done") {
              onSettledRef.current(resolvedId);
            } else if (name === "flag") {
              // Model ran out of output budget or refused. If no text has
              // streamed, turn it into a visible error so the user isn't
              // staring at an empty bubble. If some text did stream, append
              // a truncation note below it.
              const reason = String(d.reason ?? "");
              const msg = reason.includes("max")
                ? "The model hit its output budget before finishing. Try a shorter question, or switch model (e.g. Claude Sonnet or GPT-5 mini)."
                : `Model flagged: ${reason}`;
              setText((t) => t ? `${t}\n\n_${msg}_` : "");
              setErr((prev) => prev ?? msg);
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

  // Label the thinking chip with the last active tool when we have one, so
  // users see "searching site …" rather than a generic "Streaming…" that
  // doesn't move for >10s on complex turns.
  const lastRunning = [...tools].reverse().find((t) => t.status === "running");
  const chipLabel = lastRunning ? "Working" : tools.length > 0 ? "Finishing" : "Thinking";

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
        <ThinkingChip startedAt={startedAtRef.current} label={chipLabel} />
      )}
    </div>
  );
}
