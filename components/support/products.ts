/** Products built by the team, promoted in the support section and essay aside. */
export interface SupportProduct {
  /** i18n key under `home.support.products` / `common.aside.products`. */
  key: "doppler" | "smsActivate";
  /** Brand name — not translated. */
  name: string;
  href: string;
  logo: string;
}

export const SUPPORT_PRODUCTS: readonly SupportProduct[] = [
  {
    key: "doppler",
    name: "DopplerVPN",
    href: "https://www.dopplervpn.org/en",
    logo: "/images/support/doppler.png",
  },
  {
    key: "smsActivate",
    name: "SMS-Activate",
    href: "https://apps.apple.com/us/app/sms-activate/id6768591062",
    logo: "/images/support/sms-activate.webp",
  },
];
