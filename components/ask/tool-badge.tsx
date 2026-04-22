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

export function ToolBadge({ name, status }: { name: string; status: "running" | "ok" | "error" }) {
  const label = LABELS[name] ?? name;
  const cls = status === "error" ? "bg-red-500/10 text-red-400" : status === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${cls}`}>
      {label}{status === "running" ? "…" : ""}
    </span>
  );
}
