"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_MODEL_ID } from "@/lib/ask/types";
import { StreamingMessage } from "./streaming-message";
import { MessageBubble } from "./message-bubble";
import { ModelPicker } from "./model-picker";

const MODEL_KEY = "ask.modelId";

export function Composer({
  conversationId, initialMessage,
}: { conversationId: string | null; initialMessage?: string }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    if (initialMessage && !submitted) {
      setSubmitted(initialMessage);
    }
  }, [initialMessage, submitted]);
  const [modelId, setModelId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    return window.localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL_ID;
  });
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const onModel = (id: string) => {
    setModelId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(MODEL_KEY, id);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    setSubmitted(v); setValue("");
  };

  return (
    <div className="space-y-3">
      {submitted && (
        <>
          <MessageBubble role="user" text={submitted} locale={locale} />
          <StreamingMessage
            conversationId={conversationId}
            message={submitted}
            locale={locale}
            modelId={modelId}
            onSettled={(id) => {
              setSubmitted(null);
              if (!conversationId && id) router.push(`/${locale}/ask/${id}`);
              else router.refresh();
            }}
          />
        </>
      )}
      {!submitted && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ModelPicker value={modelId} onChange={onModel} />
            <span className="text-xs text-[var(--color-fg-3)]">Enter to send · Shift+Enter newline</span>
          </div>
          <div className="flex gap-2">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask a physics question…"
              rows={2}
              maxLength={4000}
              autoFocus
              className="flex-1 border border-[var(--color-fg-4)] rounded px-3 py-2 resize-y bg-[var(--color-bg-0)] text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none focus:border-[var(--color-cyan-dim)]"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="border border-[var(--color-cyan-dim)] rounded px-4 py-2 text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
