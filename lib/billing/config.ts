import "server-only";

export type RevolutEnv = "sandbox" | "production";

export interface RevolutConfig {
  env: RevolutEnv;
  apiBase: string;
  apiKey: string;
  webhookSecret: string;
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See .env.example for Revolut setup.`);
  return v;
}

export function getRevolutConfig(): RevolutConfig {
  const env = (process.env.REVOLUT_ENV ?? "sandbox") as RevolutEnv;
  if (env !== "sandbox" && env !== "production") {
    throw new Error(`REVOLUT_ENV must be "sandbox" or "production", got "${env}"`);
  }
  const apiBase =
    env === "production"
      ? "https://merchant.revolut.com/api"
      : "https://sandbox-merchant.revolut.com/api";
  // Note: NEXT_PUBLIC_REVOLUT_PUBLIC_KEY is intentionally NOT required here.
  // The browser SDK (lib/billing/revolut-client.ts) uses the per-order
  // `public_id` returned from createOrder() — there is no "public key" in
  // Revolut Merchant's flow the way there is with Stripe's `pk_...`.
  return {
    env,
    apiBase,
    apiKey: must("REVOLUT_API_KEY"),
    webhookSecret: must("REVOLUT_WEBHOOK_SECRET"),
  };
}
