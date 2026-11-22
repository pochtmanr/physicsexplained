import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";
import { FramedCard } from "@/components/layout/framed-card";
import { SUPPORT_PRODUCTS, storePlatforms } from "@/components/support/products";
import { PrimaryProductLink } from "@/components/support/primary-product-link";

export async function SupportSection() {
  const t = await getTranslations("home.support");
  const tStores = await getTranslations("common.stores");

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
        {SUPPORT_PRODUCTS.map((product) => {
          const stores = storePlatforms(product);
          return (
            <FramedCard key={product.key} innerClassName="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <Image
                  src={product.logo}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-lg border border-[var(--color-fg-4)] object-cover"
                />
                <div className="min-w-0">
                  {/* Primary link: web site by default, the visitor's store on phones and tablets. */}
                  <PrimaryProductLink
                    links={product.links}
                    ctaLabels={{
                      web: t(`products.${product.key}.cta.web`),
                      ios: product.links.ios ? tStores("iosCta") : undefined,
                      android: product.links.android
                        ? tStores("androidCta")
                        : undefined,
                    }}
                    className="group block"
                    ctaClassName="mt-2 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] transition-colors group-hover:text-[var(--color-cyan)]"
                  >
                    <span className="flex items-center gap-1.5 text-[var(--color-fg-0)]">
                      <span className="text-sm font-medium transition-colors group-hover:text-[var(--color-cyan)]">
                        {product.name}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0 text-[var(--color-fg-3)] transition-colors group-hover:text-[var(--color-cyan)]"
                      />
                    </span>
                    <span className="mt-1.5 block text-sm leading-snug text-[var(--color-fg-2)]">
                      {t(`products.${product.key}.description`)}
                    </span>
                  </PrimaryProductLink>
                  {stores.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--color-fg-4)]/40 pt-3">
                      {stores.map((platform) => (
                        <li key={platform}>
                          <a
                            href={product.links[platform]}
                            target="_blank"
                            rel="noopener"
                            className="text-xs text-[var(--color-fg-2)] underline decoration-[var(--color-fg-4)] underline-offset-4 transition-colors hover:text-[var(--color-cyan)]"
                          >
                            {tStores(platform, { name: product.name })}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </FramedCard>
          );
        })}
      </div>
    </section>
  );
}
