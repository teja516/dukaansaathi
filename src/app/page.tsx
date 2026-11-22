import type { Metadata } from 'next';
import { currentSession } from '@/lib/currentSession';
import { DashboardView } from '@/components/DashboardView';
import { Landing } from '@/components/landing/Landing';

// The answer depends on who is asking, so this page is rendered per request.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (await currentSession()) return { title: 'Dashboard' };
  return {
    title: { absolute: "DukaanSaathi: know your shop's cash before it runs short" },
    description:
      'Keep udhaar, supplier bills and expenses in one place. See your cash for the next 30, 60 and 90 days, in English and Hindi. Made for kirana and neighbourhood shops.',
  };
}

/** `/` is the landing page for visitors and the dashboard for signed-in shopkeepers. */
export default async function Home() {
  return (await currentSession()) ? <DashboardView /> : <Landing />;
}
