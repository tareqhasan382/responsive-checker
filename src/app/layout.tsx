import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { THEME_INIT_SCRIPT } from '@/config/theme';
import './globals.css';

const TITLE = 'Responsive Tester — Test Your Website at Any Screen Size';
const DESCRIPTION =
  'A lightweight browser-based responsive UI testing tool for mobile, tablet, desktop, 2K and 4K viewports. No backend, no uploads.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Responsive Tester',
  keywords: [
    'responsive design',
    'responsive tester',
    'viewport tester',
    'device preview',
    'responsive ui testing',
    'screen size preview',
  ],
  authors: [{ name: 'Responsive Tester' }],
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Responsive Tester',
    locale: 'en',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d0f' },
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/*
          Stamps the stored theme onto <html> before first paint. This has to be
          a blocking inline script in the document head — anything React renders
          runs too late, which would show a flash of the wrong theme on every
          load. `next/script` keeps it out of the component tree and out of the
          client bundle, so no `dangerouslySetInnerHTML` is needed in app code.
        */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {/* Sits above every route so an unexpected render error anywhere in the
            app degrades to a reloadable fallback instead of a blank page. */}
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
