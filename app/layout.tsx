import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/map.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trainflow - Trafic ferroviaire en temps réel",
    template: "%s | Trainflow",
  },
  description:
    "Visualisez le trafic des trains SNCF en temps réel sur une carte interactive. Suivez les retards, les horaires et la position exacte des trains.",
  keywords: [
    "train",
    "sncf",
    "idfm",
    "temps réel",
    "carte",
    "trafic",
    "retard",
    "horaire",
    "ratp",
    "transilien",
    "rer",
    "ter",
    "tgv",
    "intercités",
  ],
  authors: [{ name: "Trainflow" }],
  creator: "Trainflow",
  publisher: "Trainflow",
  metadataBase: new URL("https://trainflow.lmcgroup.xyz"),
  openGraph: {
    title: "Trainflow - Trafic ferroviaire en temps réel",
    description:
      "Visualisez le trafic des trains SNCF en temps réel sur une carte interactive. Suivez les retards, les horaires et la position exacte des trains.",
    url: "https://trainflow.lmcgroup.xyz",
    siteName: "Trainflow",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/banner/trainflow-banner.png",
        width: 1200,
        height: 630,
        alt: "Trainflow Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trainflow - Trafic ferroviaire en temps réel",
    description:
      "Visualisez le trafic des trains SNCF et IDFM en temps réel sur une carte interactive.",
    images: ["/banner/trainflow-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
