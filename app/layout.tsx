import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import localFont from "next/font/local";
import { Navigation } from "@/components/core/navigation";
import ThemeProvider from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const sansFont = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = localFont({
  variable: "--font-mono",
  src: "../fonts/CascadiaCode.woff2",
});

export const metadata: Metadata = {
  title: "Handy Tools",
  description:
    "Browser based video and image Compressor, Favicon Generator, Meta Tags Generator and verifier.",
  manifest: "/site.webmanifest",
  icons: [
    {
      url: "/favicon.ico",
      rel: "icon",
      type: "image/x-icon",
      sizes: "any",
    },
    {
      url: "/icon.svg",
      rel: "icon",
      type: "image/svg+xml",
    },
    {
      url: "/apple-touch-icon.png",
      rel: "apple-touch-icon",
      type: "image/png",
    },
  ],
  robots: "index, follow",
  keywords: [
    "tools",
    "developer",
    "handy",
    "useful",
    "websites",
    "video",
    "compress",
    "favicon",
    "generator",
    "meta",
  ],
  openGraph: {
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Handy Tools",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#262626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="min-h-screen flex flex-col"
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${sansFont.variable} ${monoFont.variable} antialiased grow flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
