import "./globals.css";
import type { Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "next-intl/server";
import { getDirection } from "@/i18n/config";
import { SITE } from "@/lib/seo/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const archiveGrotesk = localFont({
  src: "./fonts/archive-grotesk.otf",
  variable: "--font-display",
  display: "swap",
});

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

// Runs before hydration to prevent a flash of the wrong theme.
const noFlashScript = `(function(){try{var t=localStorage.getItem('physics-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} ${archiveGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
