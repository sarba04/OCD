import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const bricolage = localFont({
  src: "../fonts/bricolage-latin-wght.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

/* Les titres « antenne » : une grotesque condensée, comme les enseignes et les habillages TV. */
const tv = localFont({
  src: "../fonts/big-shoulders-latin-wght.woff2",
  variable: "--font-bs",
  weight: "100 900",
  display: "swap",
  fallback: ["Impact", "Arial Narrow", "sans-serif"],
});

/* Les timecodes et étiquettes de régie. */
const mono = localFont({
  src: "../fonts/jetbrains-mono-latin-wght.woff2",
  variable: "--font-jb",
  weight: "100 800",
  display: "swap",
  fallback: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
});

const SITE = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "OCD Live : réserve ton live à Lomé ou à distance",
  description:
    "Passe en live sur House of Challenge et place ton produit devant toute l'Afrique. Au studio à Lomé ou depuis ta boutique, dès 15 000 F. Réservation en 2 minutes.",
  applicationName: "OCD Live",
  alternates: { canonical: "/" },
  keywords: ["OCD Live", "live Lomé", "live TikTok Togo", "House of Challenge", "vendre en live", "studio live Lomé", "OCD"],
  category: "business",
  openGraph: {
    title: "OCD Live : passe en live, place ton produit",
    description: "Au studio à Lomé ou à distance, partout en Afrique. Choisis ton jour, ton heure, ton pack : c'est réservé.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OCD Live" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0c0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${tv.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* active les apparitions au défilement seulement si le JavaScript tourne */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
