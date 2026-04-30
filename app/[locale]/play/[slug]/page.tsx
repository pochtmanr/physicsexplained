import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PLAYGROUND_SLUGS, getPlayground } from "../_components/playground-meta";
import { PlaygroundShell } from "../_components/playground-shell";
import { PlaygroundLoader } from "./playground-loader";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    PLAYGROUND_SLUGS.map((slug) => ({ locale, slug })),
  );
}

interface Params {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const meta = getPlayground(slug);
  if (!meta) return {};
  const t = await getTranslations({ locale });
  return {
    title: t(meta.titleKey),
  };
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const meta = getPlayground(slug);
  if (!meta) notFound();

  const t = await getTranslations({ locale });
  const title = t(meta.titleKey);

  return (
    <PlaygroundShell
      title={title}
      shareTitle={title}
      sceneId={meta.sceneId}
      aiPromptKey={meta.aiPromptKey}
      encodedParams={new URLSearchParams()}
      backHref={`/${locale}/play`}
    >
      <PlaygroundLoader slug={slug} />
    </PlaygroundShell>
  );
}
