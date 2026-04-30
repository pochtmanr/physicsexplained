export type BranchSlug =
  | "classical-mechanics"
  | "electromagnetism"
  | "thermodynamics"
  | "relativity"
  | "quantum"
  | "modern-physics";

export type TopicStatus = "live" | "draft" | "coming-soon";
export type BranchStatus = "live" | "coming-soon";

export interface Module {
  slug: string;
  title: string;
  index: number;
}

export interface Topic {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  readingMinutes: number;
  status: TopicStatus;
  module: string;
}

export interface Branch {
  slug: BranchSlug;
  index: number;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  modules: readonly Module[];
  topics: readonly Topic[];
  status: BranchStatus;
}

export interface TopicRef {
  branchSlug: BranchSlug;
  topicSlug: string;
}

export interface MajorWork {
  title: string;
  year: string;
  description: string;
}

export interface Physicist {
  slug: string;
  born: string;
  died: string;
  nationality: string;
  image?: string;
  relatedTopics: readonly TopicRef[];
}

export type GlossaryCategory =
  | "instrument"
  | "concept"
  | "unit"
  | "phenomenon";

export interface GlossaryImage {
  src: string;
}

export interface GlossaryTerm {
  slug: string;
  category: GlossaryCategory;
  visualization?: string;
  illustration?: string;
  images?: readonly GlossaryImage[];
  relatedPhysicists?: readonly string[];
  relatedTopics?: readonly TopicRef[];
}

// ────────────────────────────────────────────────────────────────────────────
// Problems + Equations (Priority 2)
// ────────────────────────────────────────────────────────────────────────────

export type ProblemDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "challenge"
  | "exam";

export interface ProblemStep {
  id: string;
  varName: string;
  canonicalExpr: string;
  units: string;
  inputDomain: Readonly<Record<string, readonly [number, number]>>;
  toleranceRel: number;
}

export interface Problem {
  id: string;
  primaryTopicSlug: string;
  relatedTopicSlugs: readonly string[];
  difficulty: ProblemDifficulty;
  equationSlugs: readonly string[];
  inputs: Readonly<Record<string, { value: number; units: string }>>;
  steps: readonly ProblemStep[];
  finalAnswerStepId: string;
  solverPath: string;
}

export interface Equation {
  slug: string;
  latex: string;
  relatedTopicSlugs: readonly string[];
}
