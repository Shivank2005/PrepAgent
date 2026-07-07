"use client";

import {
  BarChart3,
  Bot,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  MessageSquareText,
  Target,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ArrowLeftRight
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken, getUserData, getActiveSessionId, getAuthToken } from "@/lib/store";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Progress Dashboard" },
  { href: "/setup", icon: Bot, label: "Prep Setup" },
  { href: "/interview", icon: Target, label: "Mock Interview" },
  { href: "/roadmap", icon: ClipboardList, label: "Study Plan" },
  { href: "/gap", icon: Target, label: "Gap Analysis" },
];

const TOOLS = [
  { href: "/status", icon: Bot, label: "Agent Status" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/compare", icon: ArrowLeftRight, label: "Compare Sessions" },
];

const BOTTOM_LINKS = [
  { action: "settings", icon: Settings, label: "Settings" },
  { action: "logout", icon: LogOut, label: "Sign out" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setUser(getUserData());
    const sessionId = getActiveSessionId();
    if (sessionId) {
      api.get(`/chat/session/${sessionId}`)
         .then(res => setSession(res.data))
         .catch(err => {
             console.error("Sidebar session fetch error:", err);
             if (err.response && err.response.status === 404) {
                 localStorage.removeItem("prepagent_active_session");
                 // Don't route here, let dashboard handle routing to avoid conflicts
             }
         });
    } else if (getAuthToken()) {
      // Fetch latest from history to remember context
      api.get("/sessions/history").then(res => {
        if (res.data && res.data.length > 0) {
          setSession(res.data[res.data.length - 1]);
        }
      }).catch(console.error);
    }
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href === "/interview" && !getActiveSessionId()) {
      e.preventDefault();
      const prev = session?.session_id || session?.id || "";
      router.push(`/generate?company=${encodeURIComponent(session?.company || "Unknown")}&role=${encodeURIComponent(session?.role || "SDE-1")}&timeline=${session?.timeline_days || 14}${prev ? `&prev=${prev}` : ""}`);
    }
  };

  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const company = session?.company || "Setup required";
  const role = session?.role || "No active role";
  const daysLeft = session?.timeline_days;

  return (
    <aside className={`glass-panel border-r border-[#2d2c41] flex flex-col flex-shrink-0 select-none z-20 h-full bg-[#0a0a0f] transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      {/* Header section */}
      <div className={`flex items-center p-5 border-b border-white/[0.05] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center text-accent">
              <Bot size={24} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">PrepAgent</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-[#a5a0c4] hover:text-white transition-all duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Active Session Card */}
      {!isCollapsed && (
        <div className="px-4 py-4 animate-fade-in">
          <div className="text-[10px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-2">
            ACTIVE SESSION
          </div>
          <div className="bg-[#181724]/80 border border-accent/20 rounded-lg p-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
             <div className="text-white text-sm font-semibold truncate">
               {session ? `${company} · ${role} · ${daysLeft} days left` : "No Active Session"}
             </div>
          </div>
        </div>
      )}

      {isCollapsed && <div className="mt-4" />}

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {/* Workspace Nav */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="text-[10px] font-mono text-[#5c5875] uppercase tracking-widest px-3 mb-2 animate-fade-in">
              WORKSPACE
            </div>
          )}
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'} rounded-lg text-sm transition-all group ${
                    isActive ? "text-accent font-medium bg-accent/10" : "text-[#a5a0c4] hover:text-white hover:bg-white/5"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`transition-colors ${isActive ? "text-accent" : "text-[#777294] group-hover:text-white"}`} />
                    {!isCollapsed && <span className="relative z-10">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.live && (
                    <span className="text-[9px] bg-[#102422] text-[#4fd9b3] border border-[#4fd9b3]/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Live
                    </span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="flex items-center justify-center w-5 h-5 text-[10px] bg-[#3a1d22] text-[#ff6b6b] border border-[#ff6b6b]/30 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tools Nav */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono text-[#5c5875] uppercase tracking-widest px-3 mb-2 animate-fade-in">
              TOOLS
            </div>
          )}
          <nav className="space-y-1">
            {TOOLS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm transition-all group ${
                    isActive ? "text-accent font-medium bg-accent/10" : "text-[#a5a0c4] hover:text-white hover:bg-white/5"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} className={`transition-colors ${isActive ? "text-accent" : "text-[#777294] group-hover:text-white"}`} />
                  {!isCollapsed && <span className="relative z-10">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={`p-3 border-t border-white/[0.05] space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {BOTTOM_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.action === "logout") {
                  clearAuthToken();
                  router.push("/login");
                } else {
                  router.push(`/${item.action}`);
                }
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} rounded-lg text-sm text-[#a5a0c4] hover:text-white hover:bg-white/5 transition-all text-left`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="text-[#777294]" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* User Profile */}
        <div className={`mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : 'px-3 pb-2'}`}>
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs border border-accent/40 flex-shrink-0 overflow-hidden">
            {userData?.preferences?.avatar_url ? (
              <img src={userData.preferences.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userData?.name ? userData.name.substring(0, 2).toUpperCase() : "AK"
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <div className="text-sm text-white font-medium truncate">{userData?.name || "Guest User"}</div>
              <div className="text-xs text-[#5c5875] truncate">{userData?.email || "guest@example.com"}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
