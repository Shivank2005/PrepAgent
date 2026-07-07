"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, PartyPopper, ArrowRight, Target, Clock, Trophy, Download, Trash2 } from "lucide-react";
import { api, deleteSession, generateLlmReport } from "@/lib/api";
import { getAuthToken, clearActiveSessionId } from "@/lib/store";
import { streamChat } from "@/lib/api";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [streamProgress, setStreamProgress] = useState<any>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    
    const fetchResult = async () => {
      try {
        const res = await api.get(`/chat/session/${sessionId}`);
        setSession(res.data);
      } catch (err) {
        console.error("Failed to load result", err);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [sessionId, router]);

  const handleNewSession = () => {
    router.push(`/generate?company=${encodeURIComponent(session?.company || "Unknown")}&role=${encodeURIComponent(session?.role || "SDE-1")}&timeline=${session?.timeline_days || 14}`);
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const handleExport = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    try {
      const reportResponse = await generateLlmReport(sessionId);
      
      // Dynamic import to avoid SSR errors
      const html2pdf = (await import('html2pdf.js')).default;
      
      const container = document.createElement("div");
      container.innerHTML = reportResponse.html;
      container.style.width = "794px";
      container.style.backgroundColor = "#ffffff";
      
      // Do NOT append to document.body! html2pdf.js will create an isolated iframe.
      // This prevents the blank page bugs caused by html2canvas interacting with the Next.js DOM.

      const opt = {
        // IMPORTANT: margin MUST be 0! 
        // If margin > 0, html2pdf's pagebreak algorithm calculates the wrong page height
        // and pushes elements to the bottom of the page instead of the next page.
        margin:       0,
        filename:     `PrepAgent-Report-${session?.company || "Session"}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, width: 794, windowWidth: 794 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // Use css mode so it respects our .page-break class and page-break-inside rules
        pagebreak:    { 
          mode: 'css', 
          avoid: ['.qa-card', '.growth-card', '.metric-row', '.callout', '.transcript-turn', '.plan-block'] 
        }
      };
      
      await html2pdf().set(opt).from(container).save();

    } catch (err: any) {
      alert(err?.message || "Unable to export this session");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    const confirmed = window.confirm("Delete this session and all of its chat history? This cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      clearActiveSessionId();
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Unable to delete this session");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-bg0">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  // Format time taken
  const timeTaken = session.time_taken || 0;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;
  const timeStr = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;



  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-bg0 p-8">
      <div className="max-w-3xl w-full animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <PartyPopper size={40} className="text-accent" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight text-center">Mock Test Completed!</h1>
        <p className="text-[#a5a0c4] mb-12 text-center text-lg">
          You've successfully finished your {session.company} preparation test.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          {/* Time Taken */}
          <div className="glass-card bg-[#12121a]/80 border border-[#2d2c41] rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 flex items-center justify-center mb-4 text-[#f59e0b]">
              <Clock size={24} />
            </div>
            <div className="text-[#a5a0c4] text-sm font-bold uppercase tracking-wider mb-2">Time Taken</div>
            <div className="text-4xl font-bold text-white">{timeStr}</div>
          </div>

          {/* Marks Scored */}
          <div className="glass-card bg-[#12121a]/80 border border-[#2d2c41] rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-4 text-[#10b981]">
              <Trophy size={24} />
            </div>
            <div className="text-[#a5a0c4] text-sm font-bold uppercase tracking-wider mb-2">Marks Scored</div>
            <div className="text-4xl font-bold text-white">{(session.final_score ?? session.readiness_score ?? 0).toFixed(0)}</div>
          </div>

          {/* Accuracy */}
          <div className="glass-card bg-[#12121a]/80 border border-[#2d2c41] rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center mb-4 text-[#8b5cf6]">
              <Target size={24} />
            </div>
            <div className="text-[#a5a0c4] text-sm font-bold uppercase tracking-wider mb-2">Accuracy</div>
            <div className="text-4xl font-bold text-white">{(session.accuracy ?? session.readiness_score ?? 0).toFixed(0)}%</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={handleDashboard}
            className="bg-[#2d2c41] hover:bg-[#3f3e58] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-sm w-full sm:w-auto text-center"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={handleNewSession}
            className="bg-accent hover:bg-accent/90 text-[#060609] font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Start New Mock Session <ArrowRight size={18} />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#12121a] hover:bg-[#1b1b27] border border-[#2d2c41] text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
          >
            <Download size={18} />
            {isExporting ? "Exporting..." : "Download Summary"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-[#2a1417] hover:bg-[#3a171c] border border-[#5a1f28] text-[#fca5a5] font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
          >
            <Trash2 size={18} />
            {isDeleting ? "Deleting..." : "Delete Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
