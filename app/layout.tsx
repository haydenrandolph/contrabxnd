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
    <html lang="en">
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
