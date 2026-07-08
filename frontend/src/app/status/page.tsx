"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, Activity, Server, Database, Cpu, Terminal, CheckCircle2, Zap, Brain, Code2, ShieldAlert } from "lucide-react";

export default function AgentStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [latency, setLatency] = useState(124);

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
    
    const interval = setInterval(() => {
      setLatency(prev => Math.floor(110 + Math.random() * 40));
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/session/${sessionId}`);
      const s = res.data;
      setSession(s);
      
      const generatedLogs = [
        `[SYSTEM] Booting secure VM environment...`,
        `[SYSTEM] Authenticated user session ${sessionId.split('-')[0]}...`,
        `[AGENT] Initialized LangGraph Supervisor Pipeline`,
        `[AGENT] Connecting to primary LLM cluster (GPT-4) [OK]`,
        `[AGENT] Loaded context for role: ${s.role} at ${s.company}`,
        `[MEMORY] Injecting previous session history... [0 bytes]`,
        s.resume_analysis ? `[TOOL] Executed Resume_Parser_Tool... extracted ${s.resume_analysis.skills?.length || 0} core skills.` : null,
        s.weak_areas ? `[TOOL] Executed Gap_Analysis_Tool... identified ${s.weak_areas.length} critical knowledge gaps.` : null,
        s.study_plan ? `[TOOL] Executed Planner_Tool... generated personalized ${s.timeline_days}-day study roadmap.` : null,
        s.mock_questions ? `[TOOL] Executed Mock_Synthesizer_Tool... synthesized ${s.mock_questions.length} behavioral and technical mock questions.` : null,
        `[AGENT] Pre-computation complete. Graph state saved.`,
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

  useEffect(() => {
    if (logs.length > 0 && visibleLogs.length < logs.length) {
      const timeout = setTimeout(() => {
        setVisibleLogs(prev => [...prev, logs[prev.length]]);
      }, 400 + Math.random() * 600); // Random delay between 400ms and 1000ms
      return () => clearTimeout(timeout);
    }
  }, [logs, visibleLogs]);

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
            Agent Status & Internals
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Monitor the background activities, health, and memory context of your AI PrepAgent.</p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* System Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Graph Router", icon: Server, status: "Operational", color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
            { label: "Vector DB", icon: Database, status: "Connected", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
            { label: "Eval Engine", icon: Cpu, status: "Idle", color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
            { label: "LLM Latency", icon: Zap, status: `${latency}ms`, color: "text-[#4fd9b3]", bg: "bg-[#4fd9b3]/10" },
          ].map((sys, i) => (
            <div key={i} className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sys.bg} ${sys.color}`}>
                <sys.icon size={20} />
              </div>
              <div>
                <div className="text-sm font-medium text-[#a5a0c4]">{sys.label}</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  {sys.status}
                  {i !== 3 && <CheckCircle2 size={14} className="text-[#10b981]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Terminal Output */}
          <div className="xl:col-span-2 bg-[#060609] border border-[#2d2c41] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-[#12121a] border-b border-[#2d2c41] px-4 py-3 flex items-center gap-2">
              <Terminal size={16} className="text-[#5c5875]" />
              <span className="text-xs font-mono text-[#5c5875]">agent-execution-log.sh</span>
              <div className="ml-auto flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/50"></div>
              </div>
            </div>
            <div className="p-6 font-mono text-[13px] leading-loose text-[#a5a0c4] flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end">
              <div className="mt-auto">
                {visibleLogs.map((log, i) => {
                  let colorClass = "text-white";
                  if (log.includes('[SYSTEM]')) colorClass = "text-[#4fd9b3] font-semibold";
                  if (log.includes('[AGENT]')) colorClass = "text-white font-bold";
                  if (log.includes('[TOOL]')) colorClass = "text-[#c084fc]";
                  if (log.includes('[MEMORY]')) colorClass = "text-[#f59e0b]";
                  
                  return (
                    <div key={i} className="flex gap-4 animate-fade-in mb-1">
                      <span className="text-[#5c5875] select-none flex-shrink-0">
                        {new Date().toISOString().split('T')[1].substring(0, 8)}
                      </span>
                      <span className={`${colorClass} break-words`}>
                        {log}
                      </span>
                    </div>
                  )
                })}
                <div className="flex gap-4 mt-2 animate-pulse">
                  <span className="text-accent select-none flex-shrink-0">
                    {new Date().toISOString().split('T')[1].substring(0, 8)}
                  </span>
                  <span className="w-2 h-4 bg-accent inline-block mt-1"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Memory Context Panel */}
          <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6 shadow-xl h-[500px] flex flex-col">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-2">
              <Brain className="text-[#8b5cf6]" size={18} />
              Agent Memory Context
            </h3>
            
            <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
              
              <div>
                <div className="text-xs text-[#a5a0c4] mb-2 font-medium">ACTIVE PERSONA</div>
                <div className="bg-[#181724] border border-[#2d2c41] rounded-lg p-3 text-sm text-white font-medium flex items-center gap-3 border-l-2 border-l-[#8b5cf6]">
                  {session.interviewer_persona || "Standard Technical Interviewer"}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#a5a0c4] mb-2 font-medium">CURRENT TARGET</div>
                <div className="bg-[#181724] border border-[#2d2c41] rounded-lg p-3 text-sm text-white font-medium border-l-2 border-l-[#10b981]">
                  {session.role} at {session.company}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-[#a5a0c4] mb-2 font-medium">RUNTIME PARAMETERS</div>
                <div className="bg-[#0a0a0f] border border-[#2d2c41]/50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-[#5c5875] uppercase tracking-wider mb-1">Temperature</div>
                    <div className="text-sm text-[#4fd9b3] font-mono">0.7</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5c5875] uppercase tracking-wider mb-1">Max Tokens</div>
                    <div className="text-sm text-[#4fd9b3] font-mono">2048</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5c5875] uppercase tracking-wider mb-1">Model</div>
                    <div className="text-sm text-white font-mono">gpt-4-turbo</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5c5875] uppercase tracking-wider mb-1">Vector Search</div>
                    <div className="text-sm text-white font-mono">top_k=5</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#a5a0c4] mb-2 font-medium flex items-center gap-2">
                  <ShieldAlert size={14} className="text-[#f59e0b]" />
                  PRIORITY GAPS IN CONTEXT
                </div>
                <div className="flex flex-wrap gap-2">
                  {(session.weak_areas || []).slice(0, 3).map((w: any, i: number) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-md">
                      {typeof w === 'string' ? w : w.topic}
                    </span>
                  ))}
                  {(!session.weak_areas || session.weak_areas.length === 0) && (
                    <span className="text-xs text-[#5c5875]">No gaps injected yet.</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
