import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Crypto Royal",
  description: "Beautiful investment dashboard",
  icons: {
    icon: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-950 text-white">
        <LanguageProvider>
          {/* Full wrapper */}
          <div className="flex flex-col min-h-screen">
            {/* Topbar */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="CryptoRoyal Logo"
                  width={40}
                  height={40}
                  className="rounded w-8 h-8 sm:w-10 sm:h-10"
                  priority
                />
                <span className="text-lg font-bold text-brand-200 sm:text-xl">
                  Crypto Royal
                </span>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
