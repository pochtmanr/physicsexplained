"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={open}
      aria-label={t("triggerLabel")}
    >
      <Search aria-hidden="true" size={14} strokeWidth={1.5} />
      <kbd
        dir="ltr"
        className="hidden items-center px-1 leading-none md:inline-flex md:h-5"
      >
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </Button>
  );
}
