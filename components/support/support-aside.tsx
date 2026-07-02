import Image from "next/image";
import { Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SUPPORT_PRODUCTS } from "@/components/support/products";

/**
 * Compact "from our team" promo rendered under the Terms group in the essay
 * sidebar. Mirrors the AsideLinks visual language (mono heading, border-s rows).
 */
export async function SupportAside() {
  const t = await getTranslations("common.aside");

  return (
    <div className="mt-8 border-t border-[var(--color-fg-4)] pt-6">
      <h3 className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
        <Heart aria-hidden="true" size={12} strokeWidth={1.5} />
        {t("fromOurTeam")}
      </h3>
      <ul className="space-y-1">
        {SUPPORT_PRODUCTS.map((product) => (
          <li key={product.key}>
            <a
              href={product.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 border-s-2 border-transparent py-1.5 ps-3 transition-colors hover:border-[var(--color-cyan-dim)]"
            >
              <Image
                src={product.logo}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 rounded border border-[var(--color-fg-4)] object-cover"
              />
              <span className="min-w-0">
                <span className="block text-sm leading-tight text-[var(--color-fg-1)] transition-colors group-hover:text-[var(--color-cyan)]">
                  {product.name}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
                  {t(`products.${product.key}`)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
