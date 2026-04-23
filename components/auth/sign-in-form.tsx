"use client";
import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/app/actions/auth";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await signInWithEmail(fd);
      if (res?.error) { setStatus("err"); setErrMsg(res.error); }
      else setStatus("sent");
    });
  };

  const onGoogle = () => start(async () => {
    const res = await signInWithGoogle(next);
    if (res?.error) { setStatus("err"); setErrMsg(res.error); }
  });

  if (status === "sent") {
    return (
      <Card>
        <div className="flex flex-col items-center text-center">
          <CheckCircle
            aria-hidden="true"
            size={36}
            strokeWidth={1.5}
            className="text-[var(--color-cyan)] mb-4"
          />
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            Magic link sent
          </div>
          <p className="mt-3 text-sm text-[var(--color-fg-1)]">
            Check{" "}
            <strong className="text-[var(--color-fg-0)] font-medium">
              {email}
            </strong>{" "}
            for the sign-in link.
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
            It can take a minute · check spam if not delivered
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <button
        type="button"
        onClick={onGoogle}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 border border-[var(--color-cyan-dim)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-fg-4)]" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
          or
        </span>
        <span className="h-px flex-1 bg-[var(--color-fg-4)]" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[var(--color-bg-0)] border border-[var(--color-fg-4)] px-3 py-2.5 text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none focus:border-[var(--color-cyan-dim)] transition-colors"
        />
        <button
          type="submit"
          disabled={pending || !email}
          className="w-full inline-flex items-center justify-center gap-2 border border-[var(--color-cyan-dim)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {status === "err" && errMsg && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">
          {errMsg}
        </p>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-6 md:p-8">
      {children}
    </div>
  );
}
