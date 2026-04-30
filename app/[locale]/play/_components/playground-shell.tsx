"use client";
import { ShareButtons } from "./share-buttons";

interface Props {
  /** Localized title shown in the playground sub-bar */
  title: string;
  shareTitle: string;
  sceneId: string;
  aiPromptKey: string;
  /** The playground component itself */
  children: React.ReactNode;
}

export function PlaygroundShell({
  title,
  shareTitle,
  sceneId,
  aiPromptKey,
  children,
}: Props) {
  return (
    <>
      <div className="absolute top-3 left-3 right-3 z-50 flex items-center justify-between gap-2 border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-3 py-2 backdrop-blur-md">
        <h1 className="truncate font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)]">
          {title}
        </h1>
        <ShareButtons
          shareTitle={shareTitle}
          sceneId={sceneId}
          aiPromptKey={aiPromptKey}
        />
      </div>
      {children}
    </>
  );
}
