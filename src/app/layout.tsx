import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://trimo-detail.vercel.app';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Trimo Detail | Gestão para Estéticas Automotivas",
    template: "%s | Trimo Detail",
  },
  description: "Sistema de agendamento online, lembretes no WhatsApp e pagamentos integrados, exclusivo para estéticas automotivas.",
  keywords: ["estética automotiva", "detailing", "agendamento", "sistema para detailer", "polimento", "vitrificação automotiva"],
  authors: [{ name: "Trimo" }],
  openGraph: {
    title: "Trimo Detail",
    description: "Gestão de agenda e pagamentos sem dor de cabeça.",
    url: baseUrl,
    siteName: "Trimo Detail",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trimo Detail | Gestão Automotiva",
    description: "Sistema completo de agendamento online e pagamentos para estéticas automotivas.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${inter.variable}`}>
      <body className="antialiased bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-[#E56B25] selection:text-white min-h-screen">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}