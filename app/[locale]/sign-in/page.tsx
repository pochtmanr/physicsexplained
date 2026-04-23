import { redirect } from "next/navigation";
import { getSsrClient } from "@/lib/supabase-server";
import { SignInForm } from "@/components/auth/sign-in-form";
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
    <div className={`${WIDE_CONTAINER} min-h-[calc(100vh-8rem)] flex items-center justify-center py-16`}>
      <div className="w-full max-w-md">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] text-center">
          Sign in · Physics.explained
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl tracking-tight text-[var(--color-fg-0)] text-center">
          Welcome{" "}
          <span className="font-display italic text-[var(--color-cyan)]">
            back
          </span>
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-1)] text-center">
          Continue with email or Google.
        </p>
        <div className="mt-8">
          <SignInForm next={next ?? "/"} />
        </div>
      </div>
    </div>
  );
}
