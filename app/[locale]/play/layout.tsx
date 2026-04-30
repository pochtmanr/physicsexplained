import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PlayLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The shell (top bar + interactivity) is mounted per-page by playground-shell.tsx.
  // Layout owns the absolute fullscreen frame so each page gets a clean 100dvh slot.
  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-bg-0)]">
      {children}
    </div>
  );
}
