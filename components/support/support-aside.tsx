import Image from "next/image";
import { Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SUPPORT_PRODUCTS, storePlatforms } from "@/components/support/products";
import { PrimaryProductLink } from "@/components/support/primary-product-link";

/**
 * Compact "from our team" promo rendered under the Terms group in the essay
 * sidebar. Mirrors the AsideLinks visual language (mono heading, border-s rows).
 */
export async function SupportAside() {
  const t = await getTranslations("common.aside");
  const tStores = await getTranslations("common.stores");

  return (
    <div className="mt-8 border-t border-[var(--color-fg-4)] pt-6">
      <h3 className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
        <Heart aria-hidden="true" size={12} strokeWidth={1.5} />
        {t("fromOurTeam")}
      </h3>
      <ul className="space-y-2">
        {SUPPORT_PRODUCTS.map((product) => {
          const stores = storePlatforms(product);
          const label = t(`products.${product.key}`);
          return (
            <li
              key={product.key}
              className="flex items-start gap-2.5 border-s-2 border-transparent py-1.5 ps-3 transition-colors hover:border-[var(--color-cyan-dim)]"
            >
              <Image
                src={product.logo}
                alt=""
                width={20}
                height={20}
                className="mt-0.5 size-5 shrink-0 rounded border border-[var(--color-fg-4)] object-cover"
              />
              <div className="min-w-0">
                <PrimaryProductLink
                  links={product.links}
                  ctaLabels={{ web: label }}
                  className="group block"
                  ctaClassName="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]"
                >
                  <span className="block text-sm leading-tight text-[var(--color-fg-1)] transition-colors group-hover:text-[var(--color-cyan)]">
                    {product.name}
                  </span>
                </PrimaryProductLink>
                {stores.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5">
                    {stores.map((platform) => (
                      <a
                        key={platform}
                        href={product.links[platform]}
                        target="_blank"
                        rel="noopener"
                        aria-label={tStores(platform, { name: product.name })}
                        className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] underline decoration-[var(--color-fg-4)] underline-offset-2 transition-colors hover:text-[var(--color-cyan)]"
                      >
                        {tStores(`${platform}Short`)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
