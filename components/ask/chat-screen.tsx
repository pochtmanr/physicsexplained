"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_MODEL_ID } from "@/lib/ask/types";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";
import { StreamingMessage } from "./streaming-message";
import { MobileChatRailTrigger } from "./mobile-chat-rail";
import { UpgradeModal } from "@/components/account/upgrade-modal";
import { PhotoUpload } from "@/components/problems/photo-upload";

const MODEL_KEY = "ask.modelId";

// Pin a fixed-position composer above the iOS / Android virtual keyboard.
// Writes `bottom` straight to the DOM via ref to avoid a React re-render on
// every visualViewport scroll/resize event (which jitters during the
// keyboard slide animation).
function useKeyboardInsetBottom(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    let raf = 0;
    const apply = () => {
      const el = ref.current;
      if (!el) return;
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      el.style.bottom = offset > 1 ? `${offset}px` : "";
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    apply();
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
    };
  }, [ref]);
}

interface Props {
  conversationId: string | null;
  variant: "landing" | "conversation";
  userName?: string | null;
  children?: React.ReactNode; // Transcript for conversation variant
}

export function ChatScreen({ conversationId, variant, userName, children }: Props) {
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
        // New conversation just materialised server-side. Navigate to its page
        // AND invalidate server component caches so AskLayout re-fetches the
        // conversation list and the rail shows the new row without a manual
        // reload.
        router.push(`/${locale}/ask/${id}`);
        router.refresh();
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
  const composerRef = useRef<HTMLDivElement>(null);
  useKeyboardInsetBottom(composerRef);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mobile chat header — opens the conversation list drawer */}
      <div className="md:hidden shrink-0 flex items-center gap-2 border-b border-[var(--color-fg-4)]/40 px-3 py-2">
        <MobileChatRailTrigger />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          Physics.Ask
        </span>
      </div>

      {showEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-16 pb-[calc(11rem+env(safe-area-inset-bottom))] md:pb-0">
          <EmptyState onPick={(p) => submit(p)} userName={userName ?? null} />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-6">
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
        </div>
      )}

      {/* Composer wrapper — fixed to viewport bottom on mobile (so it floats
          above the on-screen keyboard via visualViewport offset), normal flow
          inline-block on desktop. The keyboard offset is written via ref to
          avoid React renders during keyboard slide. */}
      <div
        ref={composerRef}
        className="fixed inset-x-0 bottom-0 z-30 md:static md:inset-auto md:bottom-auto shrink-0 border-t border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)] pb-[env(safe-area-inset-bottom)] md:pb-0"
      >
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6 pb-3 pt-2 md:pb-4">
          <div className="mb-2">
            <PhotoUpload />
          </div>
          <Composer
            value={text}
            onChange={setText}
            onSubmit={() => submit()}
            modelId={modelId}
            onModelChange={onModelChange}
            disabled={!!pending}
          />
        </div>
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
