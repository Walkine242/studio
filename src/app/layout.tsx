import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppPagesLayout } from './app-pages-layout';
import { AuthProvider } from '@/lib/auth/auth-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://dualswim.app'),
  title: {
    default: 'Dual — Competitive Swimming & Virtual Meets',
    template: '%s | Dual',
  },
  description: 'Join global virtual swim meets, generate custom AI workouts, and battle swimmers worldwide in live head-to-head duals.',
  openGraph: {
    title: 'Dual — Competitive Swimming & Head-to-Head Duals',
    description: 'Enter virtual swim meets, generate custom AI workouts, and track global leaderboards.',
    url: 'https://dualswim.app',
    siteName: 'Dual',
    images: [
      {
        url: '/Dual.png?v=2',
        width: 1200,
        height: 630,
        alt: 'Dual — Competitive Swimming Platform',
      },
      {
        url: '/og-image.png?v=2',
        width: 1200,
        height: 630,
        alt: 'Dual — Competitive Swimming Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dual — Competitive Swimming & Virtual Meets',
    description: 'Enter virtual swim meets, generate custom AI workouts, and track global leaderboards.',
    images: ['/Dual.png?v=2'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppPagesLayout>{children}</AppPagesLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
