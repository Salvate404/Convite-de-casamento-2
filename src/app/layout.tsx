import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import { wedding } from "@/lib/wedding";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: `${wedding.coupleShort} — Convite de Casamento`,
  description: `Você está convidado para o casamento de ${wedding.bride} e ${wedding.groom}. ${wedding.dateLabel}.`,
  openGraph: {
    title: `${wedding.coupleShort} — Convite de Casamento`,
    description: wedding.supporting,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
