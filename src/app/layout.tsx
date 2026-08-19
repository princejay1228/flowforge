import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowForge",
  description:
    "A universal AI-powered workflow compiler and management platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* 
        =========================================================
        FLOWFORGE ARCHITECTURE & SCAFFOLDING
        Authored & Architected by: Jayadeep
        Timestamp: 2026-08-17T13:45:50+05:30
        =========================================================
      */}
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
