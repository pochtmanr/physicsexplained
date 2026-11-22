/** Products built by the team, promoted in the support section, essay aside and footer. */
export type ProductPlatform = "web" | "ios" | "android";

export interface SupportProduct {
  /** i18n key under `home.support.products` / `common.aside.products`. */
  key: "doppler" | "smsCode";
  /** Brand name — not translated. */
  name: string;
  logo: string;
  /**
   * Every link is rendered in server HTML. `web` is the default primary link;
   * on iOS / Android the primary button switches to the matching store link.
   */
  links: { web: string; ios?: string; android?: string };
}

export const SUPPORT_PRODUCTS: readonly SupportProduct[] = [
  {
    key: "doppler",
    name: "Doppler VPN",
    logo: "/images/support/doppler.png",
    links: {
      web: "https://www.dopplervpn.org/en",
      ios: "https://apps.apple.com/app/doppler-vpn/id6757091773",
      android:
        "https://play.google.com/store/apps/details?id=org.dopplervpn.android",
    },
  },
  {
    key: "smsCode",
    name: "SMS Code",
    logo: "/images/support/sms-code.png",
    links: {
      web: "https://simnetiq.xyz/",
      ios: "https://apps.apple.com/app/id6803515179",
    },
  },
];

/** Store platforms a product is available on, in display order. */
export function storePlatforms(
  product: SupportProduct,
): Array<Exclude<ProductPlatform, "web">> {
  return (["ios", "android"] as const).filter((p) => product.links[p]);
}
