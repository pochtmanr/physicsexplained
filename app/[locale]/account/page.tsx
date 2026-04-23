import { redirect } from "next/navigation";

export default async function AccountPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/ask?drawer=profile`);
}
