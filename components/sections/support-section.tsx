import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";
import { FramedCard } from "@/components/layout/framed-card";
import { SUPPORT_PRODUCTS } from "@/components/support/products";

export async function SupportSection() {
  const t = await getTranslations("home.support");

  return (
    <section id="support" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-fg-2)]">
        {t("body")}
      </p>
      <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 md:gap-6">
        {SUPPORT_PRODUCTS.map((product) => (
          <a
            key={product.key}
            href={product.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <FramedCard innerClassName="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <Image
                  src={product.logo}
                  alt={product.name}
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-lg border border-[var(--color-fg-4)] object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[var(--color-fg-0)]">
                    <span className="text-sm font-medium transition-colors group-hover:text-[var(--color-cyan)]">
                      {product.name}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={14}
                      strokeWidth={1.5}
                      className="shrink-0 text-[var(--color-fg-3)] transition-colors group-hover:text-[var(--color-cyan)]"
                    />
                  </div>
                  <p className="mt-1.5 text-sm leading-snug text-[var(--color-fg-2)]">
                    {t(`products.${product.key}.description`)}
                  </p>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
                    {t(`products.${product.key}.cta`)}
                  </div>
                </div>
              </div>
            </FramedCard>
          </a>
        ))}
      </div>
    </section>
  );
}
