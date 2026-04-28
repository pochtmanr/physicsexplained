import { redirect } from "next/navigation";
import { getSsrClient } from "@/lib/supabase-server";
import { SignInForm } from "@/components/auth/sign-in-form";
import { HeroBackground } from "@/components/sections/hero-background";
import { FramedCard } from "@/components/layout/framed-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (user) redirect(next ?? "/");

  return (
    <section className="relative isolate overflow-hidden min-h-[calc(100vh-8rem)] flex items-center justify-center py-16">
      <HeroBackground />
      <div className={`${WIDE_CONTAINER} relative z-10`}>
        <div className="w-full max-w-md mx-auto">
          <FramedCard innerClassName="px-6 py-10 md:px-8 md:py-12">
            <div className="text-center">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
                Sign in · Physics.explained
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl tracking-tight text-[var(--color-fg-0)]">
                Welcome{" "}
                <span className="font-display italic text-[var(--color-cyan)]">
                  back
                </span>
              </h1>
              <p className="mt-3 text-sm text-[var(--color-fg-1)]">
                Continue with Google to access Physics.Ask, save your progress,
                and pick up where you left off.
              </p>
            </div>
            <div className="mt-8">
              <SignInForm next={next ?? "/"} />
            </div>
          </FramedCard>
        </div>
      </div>
    </section>
  );
}
