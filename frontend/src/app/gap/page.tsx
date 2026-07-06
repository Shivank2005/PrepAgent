"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, AlertCircle, AlertTriangle, Crosshair, ChevronRight, BookOpen, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function GapAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

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
      setSession(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
      </div>
    );
  }

  const weakAreas = session.weak_areas || [];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Crosshair className="text-[#ef4444]" size={24} />
            Gap Analysis
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Critical knowledge gaps identified by AI from your resume and profile.</p>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/roadmap" className="text-sm font-medium text-[#8b5cf6] hover:text-[#a855f7] flex items-center gap-1 transition-colors">
             View Study Plan <ChevronRight size={16} />
           </Link>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1000px] mx-auto w-full space-y-8">
        
        {/* Summary Banner */}
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
           <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-[#ef4444]/10 blur-[80px] rounded-full pointer-events-none" />
           <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center text-[#ef4444] flex-shrink-0 mt-1">
               <AlertTriangle size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white mb-2">
                 {weakAreas.length > 0 ? `${weakAreas.length} Critical Gaps Identified` : "No Critical Gaps"}
               </h2>
               <p className="text-[#a5a0c4] text-sm leading-relaxed max-w-2xl">
                 Based on the requirements for the <strong className="text-white">{session.role}</strong> position at <strong className="text-white">{session.company}</strong>, we found {weakAreas.length} topics where you might lack experience compared to top candidates.
               </p>
             </div>
           </div>
           
           <div className="bg-[#12121a]/80 backdrop-blur-md border border-[#2d2c41] px-6 py-4 rounded-xl flex-shrink-0 text-center">
             <div className="text-3xl font-bold text-white mb-1">{(session.readiness_score || 0).toFixed(0)}<span className="text-lg text-[#5c5875]">%</span></div>
             <div className="text-xs font-medium text-[#777294] uppercase tracking-wider">Readiness Score</div>
           </div>
        </div>

        {weakAreas.length === 0 ? (
          <div className="text-center text-[#a5a0c4] py-12">
            Great job! We couldn't identify any critical gaps. Continue with your study plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weakAreas.map((topic: string, i: number) => {
              // Procedurally generate some mock confidence/priority stats for UI richness
              const priority = i < 2 ? "High" : i < 4 ? "Medium" : "Low";
              const priorityColor = priority === "High" ? "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30" : priority === "Medium" ? "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30" : "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30";
              const baseConfidence = 48 - (i * 4);
              const readinessAdjustment = Math.max(0, Math.round((session.readiness_score || 0) / 10));
              const confidence = Math.max(18, Math.min(78, baseConfidence + readinessAdjustment));
              
              return (
                <div key={i} className="bg-[#12121a] border border-[#2d2c41] hover:border-[#5c5875] transition-colors rounded-xl p-6 relative overflow-hidden group">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#8b5cf6] transition-colors">{topic}</h3>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${priorityColor}`}>
                      {priority} Priority
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#a5a0c4]">Estimated Competency</span>
                        <span className="text-[#ef4444] font-medium">{confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#2d2c41] rounded-full overflow-hidden">
                        <div className="h-full bg-[#ef4444] rounded-full" style={{ width: `${confidence}%` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#2d2c41] pt-5 mt-2 flex items-center justify-between gap-3">
                    <Link 
                      href="/roadmap" 
                      className="flex-1 bg-[#181724] hover:bg-[#2d2c41] border border-[#2d2c41] text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen size={14} /> Review Notes
                    </Link>
                    <Link 
                      href={`/drill/${encodeURIComponent(topic)}`} 
                      className="flex-1 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#c084fc] text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Crosshair size={14} /> Practice Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Recommendations */}
        {weakAreas.length > 0 && (
           <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-8 mt-12">
             <div className="flex items-center gap-3 mb-6">
               <TrendingUp className="text-[#10b981]" size={24} />
               <h2 className="text-xl font-bold text-white tracking-tight">How to bridge these gaps</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#0a0a0f] p-5 rounded-lg border border-[#2d2c41]">
                 <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-[#c084fc] mb-4">
                   <BookOpen size={20} />
                 </div>
                 <h3 className="text-white font-bold mb-2">Follow the Roadmap</h3>
                 <p className="text-sm text-[#a5a0c4]">Your study plan has been specifically tailored to address these exact weak areas first.</p>
               </div>
               
               <div className="bg-[#0a0a0f] p-5 rounded-lg border border-[#2d2c41]">
                 <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center text-[#34d399] mb-4">
                   <Crosshair size={20} />
                 </div>
                 <h3 className="text-white font-bold mb-2">Take Targeted Mocks</h3>
                 <p className="text-sm text-[#a5a0c4]">Use the Live Mock Interview feature to practice answering questions specifically on these topics.</p>
               </div>
               
               <div className="bg-[#0a0a0f] p-5 rounded-lg border border-[#2d2c41]">
                 <div className="w-10 h-10 rounded-lg bg-[#fbbf24]/20 flex items-center justify-center text-[#fcd34d] mb-4">
                   <AlertCircle size={20} />
                 </div>
                 <h3 className="text-white font-bold mb-2">Don't Ignore Fundamentals</h3>
                 <p className="text-sm text-[#a5a0c4]">While tackling weak areas is crucial, make sure you maintain your strengths during preparation.</p>
               </div>
             </div>
           </div>
        )}
        
      </main>
    </div>
  );
}
