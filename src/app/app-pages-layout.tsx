'use client';
import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';

export function AppPagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
