import { redirect } from 'next/navigation';

export default async function DispatcherDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dispatcher/pickups`);
}
