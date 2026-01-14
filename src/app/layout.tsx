import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mesopotamia SDK | Unified Iraqi Payment Infrastructure",
  description: "One SDK for all Iraqi payment gateways. Integrate ZainCash, FastPay, and FIB with a single, secure, enterprise-grade API.",
  keywords: ["Iraq", "payment", "SDK", "ZainCash", "FastPay", "FIB", "gateway", "API", "Flutter", "Node.js"],
  authors: [{ name: "Mesopotamia SDK Team" }],
  openGraph: {
    title: "Mesopotamia SDK | Unified Iraqi Payment Infrastructure",
    description: "One SDK for all Iraqi payment gateways. Integrate ZainCash, FastPay, and FIB with a single API.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesopotamia SDK",
    description: "Unified Iraqi Payment Infrastructure SDK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg-primary)] text-white`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
