import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "next-intl/server";
import { getDirection } from "@/i18n/config";

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
  title: "physics",
  description: "Visual-first physics explainers.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${archiveGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
