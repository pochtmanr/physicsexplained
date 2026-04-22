import Link from "next/link";

const PATH: Record<string, (slug: string) => string> = {
  topic: (slug) => `/${slug}`,
  physicist: (slug) => `/physicists/${slug}`,
  glossary: (slug) => `/dictionary/${slug}`,
};

export function Cite({
  kind, slug, locale,
}: { kind: "topic" | "physicist" | "glossary"; slug: string; locale: string }) {
  const href = `/${locale}${PATH[kind](slug)}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs border rounded px-2 py-0.5 mx-0.5 hover:bg-muted"
    >
      <span className="opacity-60">{kind}:</span> {slug}
    </Link>
  );
}
