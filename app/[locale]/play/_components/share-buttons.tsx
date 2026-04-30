"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link2, X as XIcon, Sparkles, Check } from "lucide-react";

interface Props {
  /** Display title used in the tweet text */
  shareTitle: string;
  /** Scene id used by the AI deeplink */
  sceneId: string;
  /** Translation key for the AI starter prompt (resolved here so we get the localized string) */
  aiPromptKey: string;
  /**
   * Encoded URL params for the current state. We pass them in pre-encoded so the
   * playground (which already builds them via usePlaygroundState) is the source of truth.
   */
  encodedParams: URLSearchParams;
}

export function ShareButtons({ shareTitle, sceneId, aiPromptKey, encodedParams }: Props) {
  const t = useTranslations("play.share");
  const tRoot = useTranslations();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const currentUrl =
    typeof window === "undefined" ? "" : window.location.href;

  const tweetUrl = (() => {
    const text = encodeURIComponent(`${shareTitle} · Physics`);
    const url = encodeURIComponent(currentUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  })();

  const askUrl = (() => {
    const aiPrompt = tRoot(aiPromptKey);
    const params = new URLSearchParams();
    params.set("scene", sceneId);
    params.set("params", encodedParams.get("s") ?? encodedParams.toString());
    params.set("prompt", aiPrompt);
    return `/${locale}/ask?${params.toString()}`;
  })();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; silently no-op
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={copyLink}
        aria-label={t("copyLink")}
        className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("tweet")}
        className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
      >
        <XIcon size={14} />
      </a>
      <a
        href={askUrl}
        aria-label={t("explain")}
        className="inline-flex h-8 items-center gap-1 rounded bg-[var(--color-cyan)] px-2 text-xs font-mono uppercase tracking-wider text-white hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)]"
      >
        <Sparkles size={14} />
        <span>{t("explain")}</span>
      </a>
    </div>
  );
}
