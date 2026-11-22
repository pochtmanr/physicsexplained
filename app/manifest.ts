import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "Physics",
    description: SITE.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#1A1D24",
    theme_color: "#1A1D24",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
