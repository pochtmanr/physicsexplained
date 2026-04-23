const LABELS: Record<string, string> = {
  searchSiteContent: "Searching site",
  getContentEntry: "Reading article",
  searchGlossary: "Searching glossary",
  listGlossaryByCategory: "Listing terms",
  searchScenes: "Finding a scene",
  showScene: "Rendering scene",
  plotFunction: "Plotting",
  plotParametric: "Plotting",
  webSearch: "Searching the web",
  fetchUrl: "Fetching page",
};

export function ToolBadge({
  name,
  status,
}: {
  name: string;
  status: "running" | "ok" | "error";
}) {
  const label = LABELS[name] ?? name;
  const cls =
    status === "error"
      ? "border-[var(--color-magenta)] text-[var(--color-magenta)]"
      : status === "ok"
      ? "border-[var(--color-cyan-dim)] text-[var(--color-cyan-dim)]"
      : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] animate-pulse";
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {label}
      {status === "running" ? "…" : ""}
    </span>
  );
}
