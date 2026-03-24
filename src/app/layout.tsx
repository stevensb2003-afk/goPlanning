import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoPlanning - Gestión Audiovisual",
  description: "Plataforma de gestión de contenido para iglesias.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoPlanning",
  },
  openGraph: {
    title: "GoPlanning - Gestión Audiovisual",
    description: "Plataforma de gestión de contenido para iglesias.",
    url: "https://goplanning-audiovisual-church.web.app",
    siteName: "GoPlanning",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "GoPlanning - Gestión Audiovisual",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoPlanning - Gestión Audiovisual",
    description: "Plataforma de gestión de contenido para iglesias.",
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import { UIProvider } from "@/context/UIContext";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import PWARegistration from "@/components/PWARegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <PWARegistration />
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <UIProvider>
                <MainLayoutWrapper>
                  {children}
                </MainLayoutWrapper>
              </UIProvider>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
