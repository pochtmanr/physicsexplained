"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function SearchTrigger() {
  const t = useTranslations("common.search");
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  const open = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("triggerLabel")}
      className="inline-flex h-6 items-center gap-2 border border-[var(--color-fg-4)] px-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] md:h-8 md:px-2.5"
    >
      <Search aria-hidden="true" size={14} strokeWidth={1.5} />
      <kbd
        dir="ltr"
        className="hidden items-center border border-[var(--color-fg-4)] px-1 text-[10px] leading-none md:inline-flex md:h-5"
      >
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}
