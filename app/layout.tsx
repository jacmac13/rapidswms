import type { Metadata } from "next";
import { Archivo, Archivo_Black, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const archivoBblack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo-black" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-plex" });

export const metadata: Metadata = {
  title: "RapidSWMS — SWMS in 60 Seconds",
  description: "Generate Safe Work Method Statements instantly for Australian tradies.",
  verification: {
    google: "NvGhHEVuRu-DWlc2_43e8NM1o_UYgQWzqD7RNmJa7JI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${archivoBblack.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
