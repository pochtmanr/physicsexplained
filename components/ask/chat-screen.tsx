"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_MODEL_ID } from "@/lib/ask/types";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";
import { StreamingMessage } from "./streaming-message";
import { UpgradeModal } from "@/components/account/upgrade-modal";

const MODEL_KEY = "ask.modelId";

interface Props {
  conversationId: string | null;
  variant: "landing" | "conversation";
  children?: React.ReactNode; // Transcript for conversation variant
}

export function ChatScreen({ conversationId, variant, children }: Props) {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();

  const [text, setText] = useState("");
  const [pending, setPending] = useState<{ user: string } | null>(null);
  const [quotaModal, setQuotaModal] = useState<null | "free_quota_exhausted" | "tokens_exhausted" | "past_due">(null);
  const [modelId, setModelId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    return window.localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL_ID;
  });

  const onModelChange = (id: string) => {
    setModelId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(MODEL_KEY, id);
  };

  const submit = (override?: string) => {
    const v = (override ?? text).trim();
    if (!v || pending) return;
    setPending({ user: v });
    setText("");
  };

  const onSettled = useCallback(
    (id: string) => {
      if (variant === "landing" && id && id !== conversationId) {
        router.push(`/${locale}/ask/${id}`);
      } else {
        setPending(null);
        router.refresh();
      }
    },
    [variant, conversationId, locale, router],
  );

  const onQuotaExhausted = useCallback(
    (reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due") => setQuotaModal(reason),
    [],
  );

  // Auto-scroll the messages region as text streams in
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [pending]);

  const showEmpty = variant === "landing" && !pending && !children;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {showEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
          <EmptyState onPick={(p) => submit(p)} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
        >
          {children}
          {pending && (
            <>
              <MessageBubble role="user" text={pending.user} locale={locale} />
              <StreamingMessage
                key={pending.user}
                conversationId={conversationId}
                message={pending.user}
                locale={locale}
                modelId={modelId}
                onSettled={onSettled}
                onQuotaExhausted={onQuotaExhausted}
              />
            </>
          )}
        </div>
      )}
      <div className="px-4 md:px-6 pb-4 pt-2 shrink-0">
        <Composer
          value={text}
          onChange={setText}
          onSubmit={() => submit()}
          modelId={modelId}
          onModelChange={onModelChange}
          disabled={!!pending}
        />
      </div>
      <UpgradeModal
        open={quotaModal !== null}
        onClose={() => setQuotaModal(null)}
        reason={quotaModal ?? "tokens_exhausted"}
        currentPlan={"free"}
      />
    </div>
  );
}
