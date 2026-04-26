import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#047857",
};

export const metadata: Metadata = {
  title: "CuentasPrecisión - Contabilidad Tributaria para MiPYMEs y TCP en Cuba",
  description: "Herramienta contable fácil e intuitiva para llevar libros contables de MiPYMEs y Trabajadores por Cuenta Propia. Tasas actualizadas según Gaceta Oficial, conversión CUP/USD en tiempo real, alertas y sugerencias tributarias estratégicas.",
  keywords: ["contabilidad Cuba", "MiPYME", "TCP", "impuestos Cuba", "ONAT", "Gaceta Oficial", "CUP", "dólar", "tasa de cambio"],
  authors: [{ name: "CuentasPrecisión" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
