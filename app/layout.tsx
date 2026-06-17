import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthModals from '@/components/auth/AuthModals';
import SearchModal from '@/components/SearchModal';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const SITE_URL = 'https://www.contrabxnd.io';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CXB',
    template: '%s | CXB',
  },
  description: 'Live Bitcoin terminal with macro signals, FedWatch probabilities, ETF flows, AI analysis, and sovereign tools. Real-time intelligence for serious Bitcoiners.',
  keywords: ['Bitcoin', 'BTC', 'Bitcoin terminal', 'Bitcoin intelligence', 'FedWatch', 'ETF flows', 'macro liquidity', 'Bitcoin education', 'DCA calculator', 'MCP server'],
  authors: [{ name: 'Contrabxnd' }],
  creator: 'Contrabxnd',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Contrabxnd',
    title: 'Contrabxnd — Bitcoin Intelligence Platform',
    description: 'Live Bitcoin terminal with macro signals, FedWatch probabilities, ETF flows, AI analysis, and sovereign tools.',
    url: SITE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contrabxnd — Bitcoin Intelligence Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@contrabxnd',
    creator: '@contrabxnd',
    title: 'Contrabxnd — Bitcoin Intelligence Platform',
    description: 'Live Bitcoin terminal with macro signals, FedWatch probabilities, ETF flows, AI analysis, and sovereign tools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Contrabxnd',
  },
};

export const viewport: Viewport = {
  themeColor: "#F7931A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before hydration to avoid a flash of the
            wrong theme and to keep the <html>-level class in sync. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('contraband-theme')==='light'){document.documentElement.classList.add('light-mode')}}catch(e){}`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `body{opacity:0}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AuthModals />
            <SearchModal />
            <ServiceWorkerRegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
