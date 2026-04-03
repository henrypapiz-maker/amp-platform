import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AMP — Acquisition Management Platform",
  description: "Structured M&A evaluation platform with 8-gate waterfall methodology",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-stone-900 text-white">
        <SessionProvider>
          <TooltipProvider>
            <QueryProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </QueryProvider>
          </TooltipProvider>
        </SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "bg-stone-800 text-stone-100 border-stone-700",
          }}
        />
      </body>
    </html>
  );
}
