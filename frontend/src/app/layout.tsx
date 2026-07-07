// Force Next.js hot reload again for status and analytics
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "PrepAgent — AI Placement Preparation",
  description: "AI-powered interview prep with RAG, LangGraph, and personalized roadmaps",
};

import GroqAssistant from "@/components/GroqAssistant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased bg-bg0 text-textPrimary h-screen flex overflow-hidden">
        <Providers>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
            {children}
          </main>
          <GroqAssistant />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333'
              }
            }}
          />
        </Providers>
        
        {/* Ambient background from globals.css */}
        <div className="ambient-bg bg-grid">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
        </div>
      </body>
    </html>
  );
}
