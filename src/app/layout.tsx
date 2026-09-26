import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Responsive UI Tester',
  description:
    'Load any URL in a resizable viewport and visually verify responsive behavior across devices. Runs entirely in your browser — no backend, no uploads.',
  applicationName: 'Responsive UI Tester',
  keywords: [
    'responsive design',
    'viewport tester',
    'responsive tester',
    'device preview',
  ],
  openGraph: {
    title: 'Responsive UI Tester',
    description:
      'Load any URL in a resizable viewport and visually verify responsive behavior across devices.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
