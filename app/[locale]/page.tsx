import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { HeroSection } from "@/components/sections/hero-section";
import { BranchesSection } from "@/components/sections/branches-section";
import { PhysicsAskSection } from "@/components/sections/physics-ask-section";
import { PhysicistsSection } from "@/components/sections/physicists-section";
import { FeaturedTopicSection } from "@/components/sections/featured-topic-section";
import { DictionarySection } from "@/components/sections/dictionary-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Physics, explained visually",
  description:
    "Visual-first physics explainers with live, accurate simulations. Classical mechanics first — quantum, relativity, and more on the way.",
  openGraph: {
    title: "Physics, explained visually",
    description:
      "Visual-first physics explainers with live, accurate simulations.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="pb-16 md:pb-32">
      <HeroSection />
      <BranchesSection />
      <PhysicsAskSection />
      <PhysicistsSection />
      <FeaturedTopicSection />
      <DictionarySection />
      <PhilosophySection />
    </main>
  );
}
