import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trimodetail.com.br';

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
    <html lang="pt-BR" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={styles.body}>
        {children}
      </body>
    </html>
  );
}

const styles = {
  body: "antialiased bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white min-h-screen",
};