"use client";
import { ShareButtons } from "./share-buttons";

interface Props {
  /** Localized title shown in the playground sub-bar */
  title: string;
  shareTitle: string;
  sceneId: string;
  aiPromptKey: string;
  /** Show a BETA badge next to the title */
  beta?: boolean;
  /** The playground component itself */
  children: React.ReactNode;
}

export function PlaygroundShell({
  title,
  shareTitle,
  sceneId,
  aiPromptKey,
  beta = false,
  children,
}: Props) {
  return (
    <>
      <div className="absolute top-3 left-3 right-3 z-50 flex items-center justify-between gap-2 border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-3 py-2 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)]">
            {title}
          </h1>
          {beta && (
            <span className="shrink-0 border border-[var(--color-cyan-dim)]/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan-dim)]">
              Beta
            </span>
          )}
        </div>
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
