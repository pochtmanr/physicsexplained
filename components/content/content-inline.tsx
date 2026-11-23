import Link from "next/link";
import katex from "katex";
import type { Inline } from "@/lib/content/blocks";
import { PhysicistLink } from "@/components/content/physicist-link";
import { Term } from "@/components/content/term";

function InlineFormula({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ContentInline({
  inlines,
  previews = true,
}: {
  inlines: Inline[];
  /**
   * Hover previews on dictionary and physicist links (default on). Pass
   * false where the text sits in a scrolling panel that would clip them.
   */
  previews?: boolean;
}) {
  return (
    <>
      {inlines.map((node, i) => (
        <InlineNode key={i} node={node} previews={previews} />
      ))}
    </>
  );
}

function InlineNode({ node, previews }: { node: Inline; previews: boolean }) {
  if (typeof node === "string") return <>{node}</>;
  switch (node.kind) {
    case "em":      return <em><ContentInline inlines={node.inlines} previews={previews} /></em>;
    case "strong":  return <strong><ContentInline inlines={node.inlines} previews={previews} /></strong>;
    case "code":    return <code>{node.text}</code>;
    case "formula": return <InlineFormula tex={node.tex} />;
    case "link":    return <Link href={node.href}>{node.text}</Link>;
    case "term":    return <Term slug={node.slug} preview={previews}>{node.text}</Term>;
    case "physicist": return <PhysicistLink slug={node.slug} preview={previews}>{node.text}</PhysicistLink>;
  }
}
