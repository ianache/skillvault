import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SkillVault — Catálogo de Skills",
    template: "%s — SkillVault",
  },
  description:
    "Descubre, publica e instala SKILL.md reutilizables para Claude Code y otros harnesses.",
  metadataBase: new URL("https://skillvault.dev"),
  openGraph: {
    type: "website",
    siteName: "SkillVault",
    title: "SkillVault — Catálogo de Skills",
    description:
      "Descubre, publica e instala SKILL.md reutilizables para Claude Code y otros harnesses.",
  },
  twitter: {
    card: "summary",
    title: "SkillVault",
    description: "Catálogo de SKILL.md reutilizables para Claude Code.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        style={{
          fontFamily: `var(--font-ibm-plex-sans), system-ui, sans-serif`,
        }}
        className={`${geist.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
