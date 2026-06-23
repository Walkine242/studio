import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppPagesLayout } from './app-pages-layout';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export const metadata: Metadata = {
  title: 'Dual',
  description: 'The ultimate app for competitive swimmers.',
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
        <AppPagesLayout>{children}</AppPagesLayout>
        <FirebaseErrorListener />
        <Toaster />
      </body>
    </html>
  );
}
