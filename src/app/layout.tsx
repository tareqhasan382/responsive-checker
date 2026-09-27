import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import {
  APP_NAME,
  APP_SHORT_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/config/site';
import { THEME_INIT_SCRIPT } from '@/config/theme';
import './globals.css';

const SHORT_TITLE = APP_SHORT_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SHORT_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: APP_NAME,
  category: 'Developer Tools',
  keywords: [
    'responsive design',
    'responsive tester',
    'viewport tester',
    'device preview',
    'responsive ui testing',
    'screen size preview',
    'mobile preview',
    'tablet preview',
    'desktop preview',
    '4k viewport',
    'smart tv viewport',
    'frontend testing',
    'ui testing',
    'cross device',
  ],
  authors: [{ name: SHORT_TITLE, url: SITE_URL }],
  creator: SHORT_TITLE,
  publisher: SHORT_TITLE,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SHORT_TITLE,
    locale: 'en_US',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: `${SHORT_TITLE} · Responsive UI Testing Tool`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og.svg'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
    // `suppressHydrationWarning` is required on <html> because the theme
    // bootstrap script mutates `class`/`style` before React hydrates, and on
    // <body> because browser extensions (Grammarly writes
    // `data-gr-ext-installed`, `data-new-gr-c-s-check-loaded`) inject their own
    // attributes onto it first. In both cases React cannot patch the difference,
    // so it would otherwise log a hydration mismatch for a change we never made.
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
