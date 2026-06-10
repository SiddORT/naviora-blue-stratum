import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Naviora — Blue Stratum",
    template: "%s | Naviora",
  },
  description:
    "Enterprise maritime assessment, simulation, competency, and certification platform by Blue Stratum.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/*
          Apply theme class before first paint to prevent flash.
          Reads the Zustand-persisted value from localStorage synchronously.
          Falls back to system preference if nothing is stored.
        */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var s = localStorage.getItem('pase-theme');
              var theme = s ? JSON.parse(s).state?.theme : null;
              if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              if (theme === 'dark') document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        `}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
