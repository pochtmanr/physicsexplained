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

  // isMac state kept in case we want to show the kbd again later without a
  // re-render churn; currently unused in the icon-only variant.
  void isMac;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("triggerLabel")}
      className="inline-flex h-6 w-6 items-center justify-center border border-[var(--color-fg-4)] text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] md:h-8 md:w-8"
    >
      <Search aria-hidden="true" size={14} strokeWidth={1.5} />
    </button>
  );
}
