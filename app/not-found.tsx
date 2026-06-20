import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-32 text-center">
      <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">
        ERROR · 404
      </div>
      <h1 className="mb-6 text-5xl uppercase text-[var(--color-fg-0)]">
        A pendulum without a pivot.
      </h1>
      <p className="mb-12 text-lg text-[var(--color-fg-1)]">
        This page is missing its fixed point. Nothing to swing around.
      </p>
      <Link
        href="/"
        className={buttonVariants({ variant: "secondary", size: "cta", className: "nav-link" })}
      >
        Return to origin
      </Link>
    </main>
  );
}
