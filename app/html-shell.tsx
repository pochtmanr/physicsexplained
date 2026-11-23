import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
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

// Runs before hydration to prevent a flash of the wrong theme.
const noFlashScript = `(function(){try{var t=localStorage.getItem('physics-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

/**
 * The document shell. Rendered by the locale layout (and the root not-found
 * page) with the locale passed in, never read from the request: reading it
 * from headers in the root layout made every page render per request.
 */
export function HtmlShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} ${archiveGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
