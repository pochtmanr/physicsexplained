import { redirect } from "next/navigation";
import { ThankYouClient } from "./thank-you-client";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  const { order } = await searchParams;
  if (!order) redirect(`/${locale}/ask`);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center px-6 py-12">
      <ThankYouClient orderId={order} locale={locale} />
    </main>
  );
}
