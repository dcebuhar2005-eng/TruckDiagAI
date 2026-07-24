import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Header";
import PageTransition from "./PageTransition";
import BottomNav from "./BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TruckDiag AI",
  description: "Baza kvarova za kamione, strojeve i vozila",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />

        <main style={{ flex: 1 }}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        <footer
          style={{
            textAlign: "center",
            padding: "18px",
            fontSize: "13px",
            color: "#888",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "var(--background)",
          }}
        >
          © {new Date().getFullYear()} TruckDiag™
          <br />
          All rights reserved.
        </footer>

        <BottomNav />
      </body>
    </html>
  );
}