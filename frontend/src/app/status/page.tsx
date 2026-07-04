"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, Activity, Server, Database, Cpu, Terminal, CheckCircle2, Zap } from "lucide-react";

export default function AgentStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    const sessionId = getActiveSessionId();
    if (!sessionId) {
      router.push("/setup");
      return;
    }
    fetchSession(sessionId);
  }, [router]);

  const fetchSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/session/${sessionId}`);
      const s = res.data;
      setSession(s);
      
      // Generate pseudo-logs based on session data
      const generatedLogs = [
        `[SYSTEM] Authenticated user session ${sessionId.split('-')[0]}...`,
        `[AGENT] Initialized LangGraph Supervisor`,
        `[AGENT] Loaded context for role: ${s.role} at ${s.company}`,
        s.resume_analysis ? `[TOOL] Executed resume parsing... extracted ${s.resume_analysis.skills?.length || 0} skills.` : null,
        s.weak_areas ? `[TOOL] Identified ${s.weak_areas.length} critical knowledge gaps.` : null,
        s.study_plan ? `[TOOL] Generated personalized 14-day study roadmap.` : null,
        s.mock_questions ? `[TOOL] Synthesized ${s.mock_questions.length} behavioral and technical mock questions.` : null,
        `[SYSTEM] Awaiting next user interaction...`
      ].filter(Boolean) as string[];

      setLogs(generatedLogs);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        localStorage.removeItem("prepagent_active_session");
        router.push("/setup");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="text-accent" size={24} />
            Agent Status
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Monitor the background activities and health of your AI PrepAgent.</p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full space-y-8">
        
        {/* System Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Graph Router", icon: Server, status: "Operational", color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
            { label: "Vector DB", icon: Database, status: "Connected", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
            { label: "Eval Engine", icon: Cpu, status: "Idle", color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
            { label: "Latency", icon: Zap, status: "124ms", color: "text-[#4fd9b3]", bg: "bg-[#4fd9b3]/10" },
          ].map((sys, i) => (
            <div key={i} className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sys.bg} ${sys.color}`}>
                <sys.icon size={20} />
              </div>
              <div>
                <div className="text-sm font-medium text-[#a5a0c4]">{sys.label}</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  {sys.status}
                  {sys.status !== "124ms" && <CheckCircle2 size={14} className="text-[#10b981]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Terminal Output */}
        <div className="bg-[#060609] border border-[#2d2c41] rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#12121a] border-b border-[#2d2c41] px-4 py-3 flex items-center gap-2">
            <Terminal size={16} className="text-[#5c5875]" />
            <span className="text-xs font-mono text-[#5c5875]">agent-execution-log.sh</span>
            <div className="ml-auto flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/50"></div>
            </div>
          </div>
          <div className="p-6 font-mono text-sm leading-loose text-[#a5a0c4] h-[400px] overflow-y-auto custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                <span className="text-[#5c5875] select-none">
                  {new Date().toISOString().split('T')[1].substring(0, 8)}
                </span>
                <span className={log.includes('[SYSTEM]') ? 'text-accent' : log.includes('[TOOL]') ? 'text-[#c084fc]' : 'text-white'}>
                  {log}
                </span>
              </div>
            ))}
            <div className="flex gap-4 mt-2 animate-pulse">
              <span className="text-accent select-none">&gt;</span>
              <span className="w-2 h-5 bg-accent inline-block"></span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
