export type BranchSlug =
  | "classical-mechanics"
  | "electromagnetism"
  | "thermodynamics"
  | "relativity"
  | "quantum"
  | "modern-physics";

export type TopicStatus = "live" | "draft" | "coming-soon";
export type BranchStatus = "live" | "coming-soon";

export interface Topic {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  readingMinutes: number;
  status: TopicStatus;
}

export interface Branch {
  slug: BranchSlug;
  index: number;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  topics: readonly Topic[];
  status: BranchStatus;
}
