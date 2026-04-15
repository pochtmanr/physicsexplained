import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import EnContent from "./content.en.mdx";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // TODO: add locale→content mapping as translations are added.
  return <EnContent />;
}
