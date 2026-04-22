"use client";
import { useState, useTransition } from "react";
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
      <div className="border rounded p-4 text-sm text-center">
        Magic link sent to <strong>{email}</strong>. Check your inbox.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onGoogle} disabled={pending}
        className="w-full border rounded px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 border-t" />
        <span>or</span>
        <div className="flex-1 border-t" />
      </div>

      <form onSubmit={onEmail} className="space-y-2">
        <input type="hidden" name="next" value={next} />
        <input
          type="email" name="email" required placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button type="submit" disabled={pending || !email}
          className="w-full border rounded px-4 py-2 text-sm hover:bg-muted disabled:opacity-60">
          {pending ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {status === "err" && errMsg && <p className="text-xs text-red-500">{errMsg}</p>}
    </div>
  );
}
