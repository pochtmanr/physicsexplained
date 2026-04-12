import { HeroSection } from "@/components/sections/hero-section";
import { BranchesSection } from "@/components/sections/branches-section";
import { PhysicistsSection } from "@/components/sections/physicists-section";
import { FeaturedTopicSection } from "@/components/sections/featured-topic-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";

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

export default function HomePage() {
  return (
    <main className="pb-32">
      <HeroSection />
      <BranchesSection />
      <PhysicistsSection />
      <FeaturedTopicSection />
      <PhilosophySection />
    </main>
  );
}
