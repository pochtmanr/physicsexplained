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
  name: string;
  shortName: string;
  born: string;
  died: string;
  nationality: string;
  oneLiner: string;
  bio: string;
  image?: string;
  contributions: readonly string[];
  majorWorks?: readonly MajorWork[];
  relatedTopics: readonly TopicRef[];
}

export type GlossaryCategory =
  | "instrument"
  | "concept"
  | "unit"
  | "phenomenon";

export interface GlossaryTerm {
  slug: string;
  term: string;
  category: GlossaryCategory;
  shortDefinition: string;
  description: string;
  history?: string;
  visualization?: string;
  illustration?: string;
  relatedPhysicists?: readonly string[];
  relatedTopics?: readonly TopicRef[];
}
