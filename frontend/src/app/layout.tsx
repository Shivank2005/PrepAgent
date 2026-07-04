// Force Next.js hot reload again for status and analytics
import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "PrepAgent — AI Placement Preparation",
  description: "AI-powered interview prep with RAG, LangGraph, and personalized roadmaps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased bg-bg0 text-textPrimary h-screen flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
          {children}
        </main>
        
        {/* Ambient background from globals.css */}
        <div className="ambient-bg">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
        </div>
      </body>
    </html>
  );
}
