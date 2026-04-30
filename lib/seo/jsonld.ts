import { SITE } from "./config";

const PUBLISHER = {
  "@type": "Organization" as const,
  name: SITE.name,
  url: SITE.baseUrl,
  logo: {
    "@type": "ImageObject" as const,
    url: `${SITE.baseUrl}/icon-512.png`,
  },
};

export interface ArticleParams {
  url: string;
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  image?: string;
  about?: string[];
}

export function buildArticleJsonLd(p: ArticleParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.headline,
    description: p.description,
    url: p.url,
    image: p.image,
    inLanguage: p.locale,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    mainEntityOfPage: p.url,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.baseUrl },
    author: { "@type": "Organization", name: SITE.name, url: SITE.baseUrl },
    publisher: PUBLISHER,
    about: p.about?.map((name) => ({ "@type": "Thing", name })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export interface PersonParams {
  url: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  nationality?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}

export function buildPersonJsonLd(p: PersonParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    url: p.url,
    name: p.name,
    birthDate: p.birthDate,
    deathDate: p.deathDate,
    nationality: p.nationality,
    description: p.description,
    image: p.image,
    sameAs: p.sameAs,
    knowsAbout: p.knowsAbout,
  };
}

export interface DefinedTermParams {
  url: string;
  name: string;
  description: string;
  slug: string;
}

export function buildDefinedTermJsonLd(p: DefinedTermParams) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: p.name,
    description: p.description,
    url: p.url,
    termCode: p.slug,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "physics dictionary",
      url: `${SITE.baseUrl}/dictionary`,
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.baseUrl,
    description: SITE.tagline,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.baseUrl}/dictionary?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
