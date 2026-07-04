"use client";

import { Bot, Bell, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "mock", label: "Mock Interviews" },
  { id: "roadmap", label: "Learning Pathways" },
  { id: "chat", label: "Mentor Chat" },
];

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  company: string;
  onStartSession?: () => void;
}

export default function Navbar({ activeTab, setActiveTab, company, onStartSession }: Props) {
  return (
    <header className="w-full glass-panel border-b border-white/[0.05] h-16 px-6 flex items-center justify-between select-none z-20 sticky top-0">
      {/* Brand Logo & Chip */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-accent to-[#a594ff] rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,106,255,0.4)]">
          <Bot size={18} />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">PrepAgent</span>
          <span className="ml-2 text-[9px] bg-accent2/10 border border-accent2/30 text-accent2 px-1.5 py-0.5 rounded font-mono shadow-[0_0_10px_rgba(79,217,179,0.1)]">
            {company}
          </span>
        </div>
      </div>

      {/* Horizontal Navigation Items */}
      <nav className="flex items-center gap-1 relative">
        {NAV.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-4 py-2 text-sm transition-colors text-center rounded-md ${
                isActive ? "text-white font-semibold" : "text-[#a5a0c4] hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-accent/20 border border-accent/40 rounded-md shadow-[0_0_15px_rgba(124,106,255,0.15)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile & CTA Action Buttons */}
      <div className="flex items-center gap-4">
        {onStartSession && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(124,106,255,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartSession}
            className="bg-gradient-to-r from-accent to-[#9f8fff] text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-all shadow-[0_0_12px_rgba(124,106,255,0.2)]"
          >
            Start Interview
          </motion.button>
        )}
        <button className="text-[#a5a0c4] hover:text-white relative p-1.5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b6b] rounded-full shadow-[0_0_8px_rgba(255,107,107,0.8)]" />
        </button>
        <div className="flex items-center gap-2 border-l border-[#2d2c41] pl-4">
          <div className="w-8 h-8 rounded-full bg-[#181724]/80 border border-[#2d2c41] flex items-center justify-center text-[#a5a0c4] hover:border-accent/40 hover:text-white transition-colors cursor-pointer">
            <User size={15} />
          </div>
        </div>
      </div>
    </header>
  );
}
