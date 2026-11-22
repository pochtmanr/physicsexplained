import { SITE } from "./config";

const PUBLISHER = {
  "@type": "Organization" as const,
  name: SITE.name,
  url: SITE.baseUrl,
  logo: {
    "@type": "ImageObject" as const,
    url: `${SITE.baseUrl}/icon-512.png`,
  },
  ...(SITE.sameAs.length > 0 ? { sameAs: [...SITE.sameAs] } : {}),
};

/** The company that owns and operates the site. */
const COMPANY = {
  "@type": "Organization" as const,
  name: SITE.company.name,
  url: SITE.company.url,
  sameAs: [...SITE.company.sameAs],
};

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    ...PUBLISHER,
    description: SITE.tagline,
    email: SITE.company.email,
    parentOrganization: COMPANY,
  };
}

/** The native iPhone / iPad app, a free download on the App Store. */
export function buildIosAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.iosApp.name,
    description: SITE.tagline,
    applicationCategory: "EducationalApplication",
    operatingSystem: "iOS, iPadOS",
    url: SITE.iosApp.url,
    installUrl: SITE.iosApp.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: COMPANY,
  };
}

export function buildAboutPageJsonLd(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url,
    name: `About ${SITE.name}`,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.baseUrl },
    mainEntity: { ...PUBLISHER, parentOrganization: COMPANY },
  };
}

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
      name: `${SITE.name} dictionary`,
      url: `${SITE.baseUrl}/dictionary`,
    },
  };
}

export interface CollectionPageParams {
  url: string;
  name: string;
  description: string;
  /** Omit for very large collections; pass numberOfItems instead. */
  items?: { name: string; url: string }[];
  numberOfItems?: number;
}

export function buildCollectionPageJsonLd(p: CollectionPageParams) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: p.url,
    name: p.name,
    description: p.description,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.baseUrl },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: p.numberOfItems ?? p.items?.length ?? 0,
      ...(p.items
        ? {
            itemListElement: p.items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              url: item.url,
            })),
          }
        : {}),
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
