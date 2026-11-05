import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Motion } from '@/components/Motion';
import { site } from '@/data/site';
import './globals.css';

// Geist is the wordmark's typeface (logo kit README: lowercase, Geist 600).
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono', display: 'swap' });

// Same object in services/[slug]/page.tsx: a page that sets openGraph replaces it wholesale.
const ogImage = { url: '/og.png', width: 1200, height: 630, alt: 'leadglobe, AI-native GTM agency' };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // The default is the home page's full title; the template applies only to child pages.
  title: { default: site.seo.title, template: `%s | ${site.name}` },
  description: site.seo.description,
  alternates: { canonical: './' },
  openGraph: { type: 'website', siteName: site.name, url: '/', title: site.seo.title, description: site.seo.description, images: [ogImage] },
  twitter: { card: 'summary_large_image', title: site.seo.title, description: site.seo.description, images: [ogImage] },
};

export const viewport: Viewport = { themeColor: '#FFFFFF' };

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
const flags = `document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')`;

const orgId = `${site.url}/#org`;
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: site.legalName,
      alternateName: site.name,
      url: site.url,
      email: site.email,
      logo: `${site.url}/brand/leadglobe-orbit-lower-horizontal-black.svg`,
      description: site.description,
    },
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      publisher: { '@id': orgId },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags }} />
      </head>
      <body>
        <a className="skip-link" href="#main">skip to content</a>
        <div id="curtain" aria-hidden="true"><div className="curtain__panel" /></div>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <Motion />
      </body>
    </html>
  );
}
