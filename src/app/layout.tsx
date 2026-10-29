import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { GradientWavesBackground } from "@/components/gradient-waves-background";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The nav reads the current viewer, so every route renders per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "BeanWater", template: "%s · BeanWater" },
  description:
    "Log your brews and roasts, chart extraction curves, and see what the specialty coffee community is dialing in.",
};

// Clerk Core 3 variable names (colorForeground / colorInput replace colorText / colorInputBackground).
const clerkAppearance = {
  variables: {
    colorPrimary: "#47918F",
    colorBackground: "#161B1E",
    colorForeground: "#E4E7EB",
    colorMutedForeground: "#8F9AA3",
    colorInput: "#0E1113",
    colorInputForeground: "#E4E7EB",
    colorBorder: "#2A3237",
    colorNeutral: "#E4E7EB",
    borderRadius: "0.75rem",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shell = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-obsidian font-sans text-sterile antialiased`}
      >
        <GradientWavesBackground />
        <Nav />
        <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );

  return clerkEnabled ? <ClerkProvider appearance={clerkAppearance}>{shell}</ClerkProvider> : shell;
}
