import clsx from "clsx";
import type { ReactNode } from "react";

export function ArticleLayout({
  children,
  aside,
  asideTopClass = "lg:mt-16",
}: {
  children: ReactNode;
  aside?: ReactNode;
  /** Tailwind class controlling the aside's top offset (aligns with page eyebrow). */
  asideTopClass?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-12 md:pb-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        <article className="max-w-[720px]">{children}</article>
        {aside && (
          <aside className={clsx("hidden lg:block", asideTopClass)}>{aside}</aside>
        )}
      </div>
    </main>
  );
}
