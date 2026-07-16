import type { Metadata } from "next";
import { Outfit, Archivo } from "next/font/google";
import { Analytics } from "@/components/site/analytics";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ayumana.com.br"),
  title: {
    default: "Ayumana — Terapia em português, onde você estiver",
    template: "%s · Ayumana",
  },
  description:
    "Encontre psicólogos brasileiros para atendimento online, no Brasil ou no exterior. Verificação de CRP, filtro por fuso horário e contato direto pelo WhatsApp.",
  applicationName: "Ayumana",
  keywords: [
    "psicólogo brasileiro",
    "terapia em português",
    "brasileiros no exterior",
    "psicoterapia online",
    "saúde mental",
  ],
  openGraph: {
    title: "Ayumana — Terapia em português, onde você estiver",
    description:
      "Psicólogos brasileiros para quem vive no Brasil ou no exterior. Atendimento online em português.",
    type: "website",
    locale: "pt_BR",
    siteName: "Ayumana",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
