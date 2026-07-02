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
  deeplink?: { sceneId: string; params: string; prompt: string } | null;
}

export function ChatScreen({ conversationId, variant, userName, children, deeplink }: Props) {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();

  const [text, setText] = useState("");
  const [pending, setPending] = useState<{ user: string } | null>(null);
  // Bumped by the error card's Retry — remounts StreamingMessage (new key) to
  // re-send the same message.
  const [attempt, setAttempt] = useState(0);
  // Conversation id created server-side mid-stream (landing variant). Reusing
  // it on retry keeps the retried question in the same conversation instead of
  // spawning a duplicate once the server's 10s dedup window has passed.
  const [resolvedConvId, setResolvedConvId] = useState<string | null>(null);
  const [quotaModal, setQuotaModal] = useState<null | "free_quota_exhausted" | "tokens_exhausted" | "past_due">(null);

  useEffect(() => {
    if (!deeplink) return;
    setText(deeplink.prompt);
    if (typeof window !== "undefined" && window.location.search) {
      const url = new URL(window.location.href);
      url.searchParams.delete("scene");
      url.searchParams.delete("params");
      url.searchParams.delete("prompt");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeplink?.sceneId]);

  const submit = (override?: string) => {
    const v = (override ?? text).trim();
    if (!v || pending) return;
    setAttempt(0);
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
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Oscilloscope backdrop — the same graticule + phosphor glow language as
          the landing hero, faded radially so message text stays quiet. Siblings
          below are positioned (relative) so they paint above it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 75% at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 78%)",
            maskImage:
              "radial-gradient(ellipse 85% 75% at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 78%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 50% 32%, color-mix(in srgb, var(--color-cyan) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* Mobile chat header — opens the conversation list drawer */}
      <div className="relative md:hidden shrink-0 flex items-center gap-2 border-b border-[var(--color-fg-4)]/40 px-3 py-2">
        <MobileChatRailTrigger />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          Physics.Ask
        </span>
      </div>

      {showEmpty ? (
        <div className="relative flex-1 flex items-center justify-center px-4 py-8 md:py-16 pb-[calc(11rem+env(safe-area-inset-bottom))] md:pb-0">
          <EmptyState onPick={(p) => submit(p)} userName={userName ?? null} />
        </div>
      ) : (
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-6">
            {children}
            {pending && (
              <>
                <MessageBubble role="user" text={pending.user} locale={locale} />
                <StreamingMessage
                  key={`${pending.user}#${attempt}`}
                  conversationId={conversationId ?? resolvedConvId}
                  message={pending.user}
                  locale={locale}
                  modelId={DEFAULT_MODEL_ID}
                  onSettled={onSettled}
                  onQuotaExhausted={onQuotaExhausted}
                  onConversationResolved={setResolvedConvId}
                  onRetry={() => setAttempt((a) => a + 1)}
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
        className="fixed inset-x-0 bottom-0 z-30 md:relative md:inset-auto md:bottom-auto shrink-0 border-t border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)] pb-[env(safe-area-inset-bottom)] md:pb-0"
      >
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6 pb-3 pt-2 md:pb-4">
          <Composer
            value={text}
            onChange={setText}
            onSubmit={() => submit()}
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
