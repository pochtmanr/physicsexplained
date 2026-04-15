import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";

interface Source {
  name: string;
  logo?: string;
  width: number;
  height: number;
}

const SOURCES: readonly Source[] = [
  { name: "Wikipedia", logo: "/images/sources/wikipedia.svg", width: 28, height: 28 },
  { name: "MIT", logo: "/images/sources/mit.svg", width: 56, height: 28 },
  { name: "Stanford", logo: "/images/sources/stanford.svg", width: 22, height: 28 },
  { name: "Caltech", logo: "/images/sources/caltech.svg", width: 64, height: 28 },
  { name: "NIST", logo: "/images/sources/nist.svg", width: 80, height: 28 },
  { name: "arXiv", logo: "/images/sources/arxiv.svg", width: 60, height: 28 },
];

const TEXT_SOURCES = ["HyperPhysics"] as const;

export async function SourcesSection() {
  const t = await getTranslations("home.sources");

  return (
    <section className={`${WIDE_CONTAINER} mt-20 md:mt-28`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-2)] text-center">
        {t("heading")}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
        {SOURCES.map((s) => (
          <div
            key={s.name}
            className="source-logo opacity-40 transition-opacity duration-[180ms] hover:opacity-75"
            title={s.name}
          >
            <Image
              src={s.logo!}
              alt={s.name}
              width={s.width}
              height={s.height}
              className="h-6 w-auto"
            />
          </div>
        ))}
        {TEXT_SOURCES.map((name) => (
          <span
            key={name}
            className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] opacity-40 transition-opacity duration-[180ms] hover:opacity-75"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
