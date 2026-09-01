import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FHQ Tech", template: "%s - FHQ Tech" },
  description: "IT ticket tracking for FHQTC schools.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={body.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
