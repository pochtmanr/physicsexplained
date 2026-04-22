import { redirect } from "next/navigation";
import { getSsrClient } from "@/lib/supabase-server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in?next=/${locale}/account`);

  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString() : "—";
  const provider = (user.app_metadata?.provider as string | undefined) ?? "email";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-8">Account</h1>
      <dl className="space-y-3 text-sm border rounded divide-y">
        <Row label="Email" value={user.email ?? "—"} />
        <Row label="User ID" value={user.id} mono />
        <Row label="Provider" value={provider} />
        <Row label="Joined" value={joined} />
      </dl>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{value}</dd>
    </div>
  );
}
