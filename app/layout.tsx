import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_APP_ORIGIN ?? 'http://localhost:3000'),
  title: 'Starlink Fleet System — Fleet Movement Control',
  description: 'Plan, track, verify and review vehicle journeys across CMSV6 and Cartrack.',
  openGraph: {
    title: 'Starlink Fleet System — Fleet Movement Control',
    description: 'Plan, track, verify and review vehicle journeys across CMSV6 and Cartrack.',
    images: [{ url: '/og.png', width: 1800, height: 900, alt: 'Starlink Fleet System fleet movement control' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starlink Fleet System — Fleet Movement Control',
    description: 'Plan, track, verify and review vehicle journeys across CMSV6 and Cartrack.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
