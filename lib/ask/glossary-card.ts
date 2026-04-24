export interface GlossaryCard {
  slug: string;
  term: string;
  shortDefinition: string;
  category: string;
  relatedTopics: Array<{ branchSlug: string; topicSlug: string; title: string | null }>;
  relatedPhysicists: Array<{ slug: string; title: string | null }>;
}

export interface TopicCard {
  slug: string;
  title: string;
  subtitle: string | null;
}

export interface PhysicistCard {
  slug: string;
  title: string;
  subtitle: string | null;
}

export interface SourcesPayload {
  topics: TopicCard[];
  physicists: PhysicistCard[];
  glossary: GlossaryCard[];
}
