"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link2, X as XIcon, Sparkles, Check } from "lucide-react";

interface Props {
  shareTitle: string;
  sceneId: string;
  aiPromptKey: string;
}

export function ShareButtons({ shareTitle, sceneId, aiPromptKey }: Props) {
  const t = useTranslations("play.share");
  const tRoot = useTranslations();
  const locale = useLocale();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build URLs from the router-tracked pathname + search params. These match
  // on server and client (next/navigation gives the same values), so no
  // hydration mismatch. We still gate origin-dependent strings on `mounted`.
  const qs = searchParams?.toString() ?? "";
  const sParam = searchParams?.get("s") ?? "";

  const fullPath = qs ? `${pathname}?${qs}` : pathname;
  const absoluteUrl = mounted ? `${window.location.origin}${fullPath}` : fullPath;

  const tweetUrl = (() => {
    const text = encodeURIComponent(`${shareTitle} · Physics`);
    const url = encodeURIComponent(absoluteUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  })();

  const askUrl = (() => {
    const aiPrompt = tRoot(aiPromptKey);
    const params = new URLSearchParams();
    params.set("scene", sceneId);
    params.set("params", sParam || qs);
    params.set("prompt", aiPrompt);
    return `/${locale}/ask?${params.toString()}`;
  })();

  async function copyLink() {
    if (!mounted) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
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
