"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, BookOpen, User, GitBranch, Atom } from "lucide-react";
import { useTranslations } from "next-intl";
import { BRANCHES } from "@/lib/content/branches";
import { PHYSICISTS } from "@/lib/content/physicists";
import { GLOSSARY } from "@/lib/content/glossary";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ResultCategory = "branch" | "topic" | "physicist" | "dictionary";

interface SearchResult {
  category: ResultCategory;
  title: string;
  subtitle: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/*  Static index — built once at module level                          */
/* ------------------------------------------------------------------ */

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const branch of BRANCHES) {
    results.push({
      category: "branch",
      title: branch.title,
      subtitle: branch.subtitle,
      href: `/${branch.slug}`,
    });

    for (const topic of branch.topics) {
      results.push({
        category: "topic",
        title: topic.title,
        subtitle: topic.subtitle,
        href: `/${branch.slug}/${topic.slug}`,
      });
    }
  }

  for (const physicist of PHYSICISTS) {
    const titleCase = physicist.slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    results.push({
      category: "physicist",
      title: titleCase,
      subtitle: `${physicist.born}–${physicist.died} · ${physicist.nationality}`,
      href: `/physicists/${physicist.slug}`,
    });
  }

  for (const term of GLOSSARY) {
    results.push({
      category: "dictionary",
      title: term.term,
      subtitle: term.shortDefinition,
      href: `/dictionary/${term.slug}`,
    });
  }

  return results;
}

const ALL_RESULTS = buildIndex();

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<ResultCategory, typeof Search> = {
  branch: GitBranch,
  topic: Atom,
  physicist: User,
  dictionary: BookOpen,
};

const CATEGORY_LABEL_KEYS: Record<ResultCategory, string> = {
  branch: "categoryBranch",
  topic: "categoryTopic",
  physicist: "categoryPhysicist",
  dictionary: "categoryDictionary",
};

const CATEGORY_ORDER: ResultCategory[] = ["branch", "topic", "physicist", "dictionary"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SearchCommand() {
  const t = useTranslations("common.search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* --- Global cmd+K / ctrl+K listener --- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* --- Focus input when opened --- */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Small delay so the dialog renders first
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* --- Lock body scroll when open (compensate for scrollbar width) --- */
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  /* --- Filter results --- */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ALL_RESULTS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q),
    );
  }, [query]);

  /* --- Group results by category, in order --- */
  const grouped = useMemo(() => {
    const map = new Map<ResultCategory, SearchResult[]>();
    for (const r of filtered) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    const out: { category: ResultCategory; results: SearchResult[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = map.get(cat);
      if (items?.length) out.push({ category: cat, results: items });
    }
    return out;
  }, [filtered]);

  /* --- Flat list for keyboard nav --- */
  const flatResults = useMemo(() => grouped.flatMap((g) => g.results), [grouped]);

  /* --- Navigate to result --- */
  const navigate = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      router.push(result.href);
    },
    [router],
  );

  /* --- Keyboard navigation --- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % Math.max(flatResults.length, 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatResults.length) % Math.max(flatResults.length, 1));
        return;
      }
      if (e.key === "Enter" && flatResults[activeIndex]) {
        e.preventDefault();
        navigate(flatResults[activeIndex]);
      }
    },
    [flatResults, activeIndex, navigate],
  );

  /* --- Reset active index on query change --- */
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* --- Scroll active item into view --- */
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[min(20vh,12rem)]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-bg-0)]/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label={t("dialogLabel")}
        className="relative w-full max-w-xl mx-4 border border-[var(--color-fg-4)] bg-[var(--color-bg-0)] shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-[var(--color-fg-4)] px-4 py-3">
          <Search
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-[var(--color-fg-3)]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 bg-transparent font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("closeLabel")}
            className="shrink-0 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {query.trim() && filtered.length === 0 && (
            <p className="px-4 py-8 text-center font-mono text-xs text-[var(--color-fg-3)]">
              {t("emptyNoResults", { query })}
            </p>
          )}

          {!query.trim() && (
            <p className="px-4 py-8 text-center font-mono text-xs text-[var(--color-fg-3)]">
              {t("emptyInitial")}
            </p>
          )}

          {grouped.map((group) => {
            const Icon = CATEGORY_ICONS[group.category];
            const label = t(CATEGORY_LABEL_KEYS[group.category]);
            return (
              <div key={group.category}>
                {/* Category header */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <Icon size={12} strokeWidth={1.5} className="text-[var(--color-fg-3)]" aria-hidden="true" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-fg-3)]">
                    {label}
                  </span>
                </div>

                {/* Items */}
                {group.results.map((result) => {
                  flatIndex++;
                  const isActive = flatIndex === activeIndex;
                  const idx = flatIndex; // capture for onClick
                  return (
                    <button
                      key={result.href}
                      type="button"
                      data-active={isActive}
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                        isActive
                          ? "bg-[var(--color-bg-1)] text-[var(--color-cyan)]"
                          : "text-[var(--color-fg-1)] hover:bg-[var(--color-bg-1)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-[var(--color-cyan)]" : "text-[var(--color-fg-0)]"}`}>
                          {result.title}
                        </p>
                        <p className="truncate text-xs text-[var(--color-fg-3)]">
                          {result.subtitle}
                        </p>
                      </div>
                      {isActive && (
                        <ArrowRight
                          size={14}
                          strokeWidth={1.5}
                          className="shrink-0 text-[var(--color-cyan)] rtl:-scale-x-100"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-[var(--color-fg-4)] px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[var(--color-fg-3)]">
              <kbd className="rounded border border-[var(--color-fg-4)] px-1 py-0.5 text-[10px]">↑↓</kbd> {t("hintNavigate")}
            </span>
            <span className="font-mono text-[10px] text-[var(--color-fg-3)]">
              <kbd className="rounded border border-[var(--color-fg-4)] px-1 py-0.5 text-[10px]">↵</kbd> {t("hintOpen")}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-fg-3)]">
            <kbd className="rounded border border-[var(--color-fg-4)] px-1 py-0.5 text-[10px]">esc</kbd> {t("hintClose")}
          </span>
        </div>
      </div>
    </div>
  );
}
