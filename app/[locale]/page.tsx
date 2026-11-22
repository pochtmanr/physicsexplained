import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { HeroSection } from "@/components/sections/hero-section";
import { BranchesSection } from "@/components/sections/branches-section";
import { PhysicsAskSection } from "@/components/sections/physics-ask-section";
import { PhysicistsSection } from "@/components/sections/physicists-section";
import { FeaturedTopicSection } from "@/components/sections/featured-topic-section";
import { DictionarySection } from "@/components/sections/dictionary-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { SupportSection } from "@/components/sections/support-section";
import { JsonLd } from "@/components/seo/jsonld";
import {
  buildWebSiteJsonLd,
  buildOrganizationJsonLd,
  buildIosAppJsonLd,
} from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return buildPageMetadata({
    path: "/",
    locale,
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="pb-16 md:pb-32">
      <JsonLd data={buildWebSiteJsonLd()} />
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildIosAppJsonLd()} />
      <HeroSection />
      <BranchesSection />
      <PhysicsAskSection />
      <PhysicistsSection />
      <FeaturedTopicSection />
      <DictionarySection />
      <PhilosophySection />
      <SupportSection />
    </main>
  );
}
