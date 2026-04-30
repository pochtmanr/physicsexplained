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

  // Sits below the sticky site nav (h-12 mobile / md:h-14). Each playground
  // page is a relative container the canvas can fill via absolute inset-0.
  return (
    <div
      className="relative w-full bg-[var(--color-bg-0)]"
      style={{ height: "calc(100dvh - 3rem)" }}
    >
      {children}
    </div>
  );
}
