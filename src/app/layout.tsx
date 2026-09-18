import type { Metadata } from "next";
import { Inter, Questrial } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

// Geometrica e leve, proxima da assinatura usada nas artes da casa.
const questrial = Questrial({
  variable: "--font-questrial",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Casa Espírita Rosa Branca",
    template: "%s | Casa Espírita Rosa Branca",
  },
  description:
    "Casa Espírita Rosa Branca — notícias, mensagens, eventos, projetos e estudo da doutrina espírita.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${questrial.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
