import katex from "katex";
import type { Block, FigureContent } from "@/lib/content/blocks";
import { ContentInline } from "@/components/content/content-inline";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { getSimulation } from "@/lib/content/simulation-registry";
import { storageUrl } from "@/lib/supabase";

export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} />
      ))}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "section":
      return (
        <Section index={block.index} title={block.title}>
          <ContentBlocks blocks={block.children} />
        </Section>
      );

    case "heading": {
      const Tag = (`h${block.level}` as "h3" | "h4");
      return <Tag>{block.text}</Tag>;
    }

    case "paragraph":
      return <p><ContentInline inlines={block.inlines} /></p>;

    case "equation": {
      const html = katex.renderToString(block.tex, { throwOnError: true, displayMode: true });
      return (
        <EquationBlock id={block.id ?? ""}>
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </EquationBlock>
      );
    }

    case "figure":
      return (
        <SceneCard caption={block.caption}>
          <FigureInner content={block.content} />
        </SceneCard>
      );

    case "callout":
      return (
        <Callout variant={block.variant}>
          <ContentBlocks blocks={block.children} />
        </Callout>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}><ContentInline inlines={item} /></li>
          ))}
        </Tag>
      );
    }
  }
}

function FigureInner({ content }: { content: FigureContent }) {
  if (content.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={storageUrl(content.src)} alt={content.alt} />;
  }
  const Component = getSimulation(content.component);
  return <Component {...(content.props ?? {})} />;
}
