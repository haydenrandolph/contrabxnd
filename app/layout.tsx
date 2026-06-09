import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthModals from '@/components/auth/AuthModals';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: "Contraband - Ideas that refuse to stay buried",
  description: "Bitcoin education, writings, and ideas worth trading. Exploring the gray markets of thought.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Contraband",
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
            <ServiceWorkerRegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
