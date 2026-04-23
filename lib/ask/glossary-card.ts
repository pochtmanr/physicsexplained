export interface GlossaryCard {
  slug: string;
  term: string;
  shortDefinition: string;
  category: string;
  relatedTopics: Array<{ branchSlug: string; topicSlug: string; title: string | null }>;
  relatedPhysicists: Array<{ slug: string; title: string | null }>;
}
