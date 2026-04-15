import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { PHYSICISTS } from "@/lib/content/physicists";
import { GLOSSARY } from "@/lib/content/glossary";

const BASE = "https://physics.it.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const branchPages: MetadataRoute.Sitemap = BRANCHES.map((b) => ({
    url: `${BASE}/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const topicPages: MetadataRoute.Sitemap = BRANCHES.flatMap((b) =>
    b.topics
      .filter((t) => t.status === "live")
      .map((t) => ({
        url: `${BASE}/${b.slug}/${t.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
  );

  const physicistPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/physicists`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...PHYSICISTS.map((p) => ({
      url: `${BASE}/physicists/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const dictionaryPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/dictionary`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...GLOSSARY.map((term) => ({
      url: `${BASE}/dictionary/${term.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [
    ...staticPages,
    ...branchPages,
    ...topicPages,
    ...physicistPages,
    ...dictionaryPages,
  ];
}
