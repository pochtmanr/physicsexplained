import { redirect } from "next/navigation";
import { getSsrClient } from "@/lib/supabase-server";
import { SignInForm } from "@/components/auth/sign-in-form";

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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2 text-center">Sign in</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Use your email or Google to continue.
        </p>
        <SignInForm next={next ?? "/"} />
      </div>
    </div>
  );
}
