"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ProductPlatform } from "@/components/support/products";

function detectPlatform(): ProductPlatform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS reports itself as a Mac; a touch screen gives it away.
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  return "web";
}

interface Props {
  links: { web: string; ios?: string; android?: string };
  /** Call-to-action text per platform; falls back to the web label. */
  ctaLabels: { web: string; ios?: string; android?: string };
  className?: string;
  ctaClassName?: string;
  children?: ReactNode;
}

/**
 * Primary link of a product card. Server HTML always carries the web link
 * (what crawlers and desktop visitors get); after mount, phones and tablets
 * are pointed at their own store listing when the product has one.
 */
export function PrimaryProductLink({
  links,
  ctaLabels,
  className,
  ctaClassName,
  children,
}: Props) {
  const [platform, setPlatform] = useState<ProductPlatform>("web");

  useEffect(() => {
    const detected = detectPlatform();
    if (links[detected]) setPlatform(detected);
  }, [links]);

  return (
    <a
      href={links[platform] ?? links.web}
      target="_blank"
      rel="noopener"
      className={className}
    >
      {children}
      <span className={ctaClassName}>
        {ctaLabels[platform] ?? ctaLabels.web}
      </span>
    </a>
  );
}
