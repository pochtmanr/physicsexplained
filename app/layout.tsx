import "./globals.css";
import type { Viewport } from "next";
import { SITE } from "@/lib/seo/config";

export const metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${SITE.name} — visual physics explainers`,
    template: `%s — ${SITE.name}`,
  },
  applicationName: SITE.name,
  description: SITE.tagline,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — visual physics explainers`,
    description: SITE.tagline,
    images: [{ url: SITE.defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
    images: [SITE.defaultOgImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1A1D24" },
    { media: "(prefers-color-scheme: light)", color: "#FAFBFD" },
  ],
};

// The <html> shell lives in app/html-shell.tsx and is rendered by the locale
// layout, which knows the locale from the URL. Keeping it out of here lets the
// pages under [locale] be prerendered.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
