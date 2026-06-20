import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import MusicPlayer from "@/components/MusicPlayer";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "F1 Bolão",
  description: "Faça seus palpites de Fórmula 1 com seus amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${titillium.className} min-h-full flex flex-col`}>
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}
