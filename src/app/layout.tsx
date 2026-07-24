import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const geist = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const ibmPlexSans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles ?? [],
      }
    : null;

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        style={{
          fontFamily: `var(--font-ibm-plex-sans), system-ui, sans-serif`,
        }}
        className={`${geist.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} min-h-screen`}
      >
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
