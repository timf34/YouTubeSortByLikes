import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from '@next/third-parties/google'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube Sort By Likes",
  description: "Find the best YouTube videos from any channel by sorting by likes or like:view ratio",
  keywords: ["youtube"],
  authors: [{ name: "Tim", url: "https://github.com/timf34" }],
  openGraph: {
    title: "YouTube Sort By Likes",
    description: "Find the best YouTube videos from any channel by sorting by likes or like:view ratio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Sort By Likes",
    description: "Find the best YouTube videos from any channel by sorting by likes or like:view ratio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-61QG9LN6BW" />
      </body>
    </html>
  );
}
