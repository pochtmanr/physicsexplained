"use client";

declare global {
  interface Window {
    RevolutCheckout?: (publicId: string, mode: "sandbox" | "prod") => Promise<{
      payWithPopup: (opts: Record<string, unknown>) => void;
    }>;
  }
}

export interface OpenCheckoutOptions {
  publicId: string;
  onSuccess: () => void;
  onError?: (e: unknown) => void;
  onCancel?: () => void;
}

export async function openRevolutCheckout(opts: OpenCheckoutOptions): Promise<void> {
  if (typeof window === "undefined") return;
  if (!window.RevolutCheckout) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      const isProd = process.env.NEXT_PUBLIC_REVOLUT_ENV === "production";
      s.src = isProd
        ? "https://merchant.revolut.com/embed.js"
        : "https://sandbox-merchant.revolut.com/embed.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Revolut Checkout"));
      document.head.appendChild(s);
    });
  }
  const mode = (process.env.NEXT_PUBLIC_REVOLUT_ENV === "production" ? "prod" : "sandbox") as "sandbox" | "prod";
  const inst = await window.RevolutCheckout!(opts.publicId, mode);
  inst.payWithPopup({
    savePaymentMethodFor: "customer",
    onSuccess: opts.onSuccess,
    onError: opts.onError ?? ((e: unknown) => console.error("Revolut error", e)),
    onCancel: opts.onCancel ?? (() => {}),
  });
}
