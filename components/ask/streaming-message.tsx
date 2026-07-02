"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ProgressTree, ThinkingChip, type ProgressStep } from "./progress-tree";

interface StreamError {
  message: string;
  code?: string;
  status?: number;
}

interface Props {
  conversationId: string | null;
  message: string;
  locale: string;
  modelId: string;
  onSettled: (convId: string) => void;
  onQuotaExhausted?: (reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due") => void;
  /** Conversation id resolved server-side (meta event) — lets the parent reuse it on retry. */
  onConversationResolved?: (convId: string) => void;
  /** Remount this component (new key) to re-send the same message. */
  onRetry?: () => void;
}

export function StreamingMessage({
  conversationId, message, locale, modelId,
  onSettled, onQuotaExhausted, onConversationResolved, onRetry,
}: Props) {
  const [text, setText] = useState("");
  const [tools, setTools] = useState<ProgressStep[]>([]);
  const [err, setErr] = useState<StreamError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const resolvedIdRef = useRef<string>(conversationId ?? "");
  // The SSE loop is a closure — it needs the live error state to decide
  // whether "done" may settle (unmount) this component.
  const errRef = useRef<StreamError | null>(null);
  const settledRef = useRef(false);
  const onSettledRef = useRef(onSettled);
  const onQuotaExhaustedRef = useRef(onQuotaExhausted);
  const onConversationResolvedRef = useRef(onConversationResolved);
  onSettledRef.current = onSettled;
  onQuotaExhaustedRef.current = onQuotaExhausted;
  onConversationResolvedRef.current = onConversationResolved;

  const fail = (e: StreamError) => {
    errRef.current = e;
    setErr(e);
  };

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
          const raw = await res.text().catch(() => "");
          let detail = raw.slice(0, 300);
          let code: string | undefined;
          try {
            const parsed = JSON.parse(raw) as { error?: string; message?: string };
            code = parsed.error;
            detail = parsed.message ?? parsed.error ?? detail;
          } catch { /* not JSON — keep raw excerpt */ }
          fail({ message: detail || "The request failed with no error body.", code, status: res.status });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
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
            if (name === "meta") {
              const id = (d.conversationId as string) || resolvedIdRef.current;
              resolvedIdRef.current = id;
              if (id) onConversationResolvedRef.current?.(id);
            } else if (name === "text") setText((t) => t + String(d.delta ?? ""));
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
              // The route always emits "done" — even right after "error" — so
              // it must NOT settle (unmount → navigation/refresh) when a hard
              // error is showing, or the error flashes for a second and
              // vanishes. The user leaves via Retry or Dismiss instead.
              if (!errRef.current) {
                settledRef.current = true;
                onSettledRef.current(resolvedIdRef.current);
              }
            } else if (name === "flag") {
              // Soft model-side notes (output budget, refusal heuristics).
              // These runs still complete and persist, so they only annotate
              // the text — they don't block settling like hard errors do.
              const reason = String(d.reason ?? "");
              const msg = reason.includes("max")
                ? "The model hit its output budget before finishing. Try a shorter question, or switch model (e.g. Claude Sonnet or GPT-5 mini)."
                : reason === "empty-completion"
                  ? ""
                  : `Model flagged: ${reason}`;
              if (msg) setText((t) => t ? `${t}\n\n_${msg}_` : msg);
            } else if (name === "error") {
              fail({
                message: String(d.message ?? "Unknown streaming error."),
                code: typeof d.code === "string" ? d.code : undefined,
              });
            }
          }
        }
        // Stream closed without a done event (e.g. connection dropped
        // mid-answer). Surface it — otherwise the spinner sits forever.
        if (!errRef.current && !settledRef.current) {
          fail({ message: "The connection closed before the answer finished.", code: "STREAM_CLOSED" });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          fail({ message: (e as Error).message, code: "NETWORK" });
        }
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
    <div className="mr-auto w-full">
      {tools.length > 0 && <ProgressTree steps={tools} />}
      {text && <MessageBubble role="assistant" text={text} locale={locale} />}
      {err && (
        <ErrorCard
          error={err}
          hasPartialText={text.length > 0}
          onRetry={onRetry}
          onDismiss={() => onSettledRef.current(resolvedIdRef.current)}
        />
      )}
      {!text && !err && (
        <ThinkingChip startedAt={startedAtRef.current} label={chipLabel} />
      )}
    </div>
  );
}

function ErrorCard({
  error, hasPartialText, onRetry, onDismiss,
}: {
  error: StreamError;
  hasPartialText: boolean;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  const label = [error.status && `HTTP ${error.status}`, error.code].filter(Boolean).join(" · ");
  return (
    <div className="my-4 max-w-2xl border-l-2 border-red-500/70 bg-red-500/10 px-4 py-3">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-red-400">
        Something went wrong{label ? ` — ${label}` : ""}
      </div>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-fg-0)]">
        {error.message}
      </p>
      {hasPartialText && (
        <p className="mt-1 text-xs text-[var(--color-fg-3)]">
          The partial answer above was not saved to this conversation.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 border border-[var(--color-fg-4)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
          >
            <RotateCcw size={12} strokeWidth={1.5} /> Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
        >
          <X size={12} strokeWidth={1.5} /> Dismiss
        </button>
      </div>
    </div>
  );
}
