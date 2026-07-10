import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mindful Therapy 360 — AI-Powered IEP & Special Education Suite",
  description:
    "Mindful Therapy 360 helps psychologists, special educators and therapists create evidence-based IEPs, run assessments, plan therapy, monitor progress and generate reports — a 360° special education suite.",
  keywords: [
    "Mindful Therapy 360",
    "IEP",
    "Special Education",
    "AI IEP Generator",
    "Therapy Planner",
    "SMART goals",
    "Special Needs",
    "Special Education Suite",
  ],
  authors: [{ name: "Mindful Therapy 360" }],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/logo-mark-512.png", type: "image/png", sizes: "512x512" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <SonnerToaster richColors position="top-right" />
        </Providers>
        {/* Liquid-glass refraction library (Apple-style). Loaded before
            interactive so window.liquidGlass is available to useLiquidGlass(). */}
        <Script src="/liquid-glass.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
