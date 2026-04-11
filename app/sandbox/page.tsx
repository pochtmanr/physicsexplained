import { SceneCard } from "@/components/layout/scene-card";
import { HUD } from "@/components/layout/hud";
import { FigureLabel } from "@/components/layout/figure-label";
import { Callout } from "@/components/layout/callout";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { EquationBlock } from "@/components/math/equation-block";

export default function SandboxPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 pb-32">
      <TopicHeader
        eyebrow="§ 99 · INTERNAL"
        title="SANDBOX"
        subtitle="A showcase of every primitive in the design system."
      />

      <Section index={1} title="Typography">
        <p>
          This is body text in Inter at 18px, line-height 1.65. The curious
          adult can read it comfortably for half an hour without strain.
          <a href="#"> Links like this</a> glow softly on hover.
        </p>
      </Section>

      <Section index={2} title="Equation blocks">
        <EquationBlock id="EQ.01">
          <span className="font-mono text-lg">F = -kx</span>
        </EquationBlock>
        <EquationBlock id="EQ.02">
          <span className="font-mono text-lg">T = 2π √(L / g)</span>
        </EquationBlock>
      </Section>

      <Section index={3} title="Callouts">
        <Callout variant="intuition">
          The further you pull, the harder it pulls back. That's the whole idea.
        </Callout>
        <Callout variant="math">
          This approximation holds only while sin θ ≈ θ.
        </Callout>
        <Callout variant="warning">
          At large angles, the period depends on amplitude.
        </Callout>
      </Section>

      <Section index={4} title="Scene cards + HUD">
        <SceneCard
          caption="FIG.00 — scene placeholder"
          hud={<HUD>θ = 0.27 rad · T = 2.01 s</HUD>}
        >
          <div className="flex h-64 items-center justify-center text-[var(--color-fg-2)]">
            (PendulumScene arrives in Phase 3)
          </div>
        </SceneCard>
      </Section>

      <Section index={5} title="Figure labels">
        <FigureLabel section="FIRST LAW" figure="FIG.01" />
      </Section>
    </main>
  );
}
