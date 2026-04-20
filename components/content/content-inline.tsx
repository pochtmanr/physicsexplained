import Link from "next/link";
import katex from "katex";
import type { Inline } from "@/lib/content/blocks";
import { PhysicistLink } from "@/components/content/physicist-link";
import { Term } from "@/components/content/term";

function InlineFormula({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ContentInline({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((node, i) => (
        <InlineNode key={i} node={node} />
      ))}
    </>
  );
}

function InlineNode({ node }: { node: Inline }) {
  if (typeof node === "string") return <>{node}</>;
  switch (node.kind) {
    case "em":      return <em>{node.text}</em>;
    case "strong":  return <strong>{node.text}</strong>;
    case "code":    return <code>{node.text}</code>;
    case "formula": return <InlineFormula tex={node.tex} />;
    case "link":    return <Link href={node.href}>{node.text}</Link>;
    case "term":    return <Term slug={node.slug}>{node.text}</Term>;
    case "physicist": return <PhysicistLink slug={node.slug}>{node.text}</PhysicistLink>;
  }
}
