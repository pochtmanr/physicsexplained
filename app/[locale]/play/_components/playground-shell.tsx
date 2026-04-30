"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShareButtons } from "./share-buttons";

interface Props {
  /** Localized title shown in the top bar */
  title: string;
  /** Localized share-card title (same as title in most cases) */
  shareTitle: string;
  sceneId: string;
  aiPromptKey: string;
  /** The playground component itself */
  children: React.ReactNode;
  backHref: string;
}

export function PlaygroundShell({
  title,
  shareTitle,
  sceneId,
  aiPromptKey,
  children,
  backHref,
}: Props) {
  const t = useTranslations("play");

  return (
    <>
      <header
        className="absolute inset-inline-0 inset-block-start-0 z-50 flex h-12 items-center justify-between gap-2 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-3 backdrop-blur-md"
      >
        <Link
          href={backHref}
          aria-label={t("back")}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="truncate font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)]">
          {title}
        </h1>
        <ShareButtons
          shareTitle={shareTitle}
          sceneId={sceneId}
          aiPromptKey={aiPromptKey}
        />
      </header>
      <main className="absolute inset-inline-0 inset-block-start-12 inset-block-end-0 overflow-hidden">
        {children}
      </main>
    </>
  );
}
