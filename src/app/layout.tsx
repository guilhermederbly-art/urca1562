import type { Metadata, Viewport } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "F1 Bolão",
  description: "Faça seus palpites de Fórmula 1 com seus amigos",
  manifest: "/manifest.json",
  appleWebApp: {
    // Ja emite mobile-web-app-capable; declarar de novo em `other` duplicava
    // a meta tag no HTML
    capable: true,
    statusBarStyle: "black-translucent",
    title: "F1 Bolão",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Necessario para que env(safe-area-inset-*) devolva valores reais em
  // iPhones com notch — sem isso o app fica embaixo da barra de status
  viewportFit: "cover",
  themeColor: "#e8002d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${titillium.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
