import katex from "katex";
import type { Block } from "@/lib/content/blocks";
import { ContentInline } from "@/components/content/content-inline";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { FigureInner } from "@/components/content/figure-inner";

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
      if (block.tex) {
        const html = katex.renderToString(block.tex, { throwOnError: true, displayMode: true });
        return (
          <EquationBlock id={block.id ?? ""}>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </EquationBlock>
        );
      }
      if (block.prose) {
        return (
          <EquationBlock id={block.id ?? ""}>
            <span className="font-mono text-lg">{block.prose}</span>
          </EquationBlock>
        );
      }
      return null;
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

    case "table":
      return (
        <table>
          {block.header ? (
            <thead>
              <tr>{block.header.map((h, i) => (<th key={i}><ContentInline inlines={h} /></th>))}</tr>
            </thead>
          ) : null}
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (<td key={j}><ContentInline inlines={cell} /></td>))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

