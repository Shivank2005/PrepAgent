"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/store";
import { Loader2, ArrowLeftRight, Check, AlertCircle, Calendar, Trophy, Clock, Target, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CompareSessionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");
  const [comparison, setComparison] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [router]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sessions/compare");
      setSessions(res.data);
      if (res.data.length >= 2) {
        setSelectedA(res.data[0].id);
        setSelectedB(res.data[1].id);
      }
    } catch (err) {
      console.error("Failed to load sessions for comparison", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;
    try {
      setCompLoading(true);
      const res = await api.get(`/sessions/compare?session_a=${selectedA}&session_b=${selectedB}`);
      setComparison(res.data);
    } catch (err) {
      console.error("Failed to fetch comparison details", err);
      alert("Error loading comparison details");
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (selectedA && selectedB) {
      handleCompare();
    }
  }, [selectedA, selectedB]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
      </div>
    );
  }

  const sessionA = comparison?.session_a;
  const sessionB = comparison?.session_b;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar p-8 max-w-[1200px] mx-auto w-full space-y-8">
      <header className="flex items-center justify-between border-b border-[#2d2c41] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ArrowLeftRight className="text-[#8b5cf6]" size={24} />
            Compare Prep Sessions
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Compare your performance, scores, and gaps between multiple interview attempts.</p>
        </div>
      </header>

      {sessions.length < 2 ? (
        <div className="text-center text-[#a5a0c4] py-16 bg-[#12121a] rounded-2xl border border-[#2d2c41] flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-[#fbbf24]" />
          <h3 className="text-lg font-bold text-white">Not Enough Sessions</h3>
          <p className="max-w-md text-sm leading-relaxed">
            You need to complete at least **2 interview sessions** to compare them side-by-side. Go complete another mock and return here!
          </p>
          <Link href="/setup" className="bg-[#8b5cf6] text-white px-5 py-2.5 rounded-lg text-sm font-bold mt-2">
            Start New Setup
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Selector bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#12121a] border border-[#2d2c41] rounded-xl p-6">
            <div>
              <label className="block text-xs font-bold text-[#a5a0c4] uppercase tracking-wider mb-2">Compare Session A</label>
              <select 
                value={selectedA} 
                onChange={(e) => setSelectedA(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#2d2c41] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#8b5cf6]"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === selectedB}>
                    {s.company} ({s.role}) - {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown Date'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#a5a0c4] uppercase tracking-wider mb-2">With Session B (Reference)</label>
              <select 
                value={selectedB} 
                onChange={(e) => setSelectedB(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#2d2c41] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#8b5cf6]"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === selectedA}>
                    {s.company} ({s.role}) - {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown Date'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {compLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
            </div>
          ) : sessionA && sessionB ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Session A details */}
              <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6 space-y-6">
                <div className="border-b border-[#2d2c41] pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider bg-[#8b5cf6]/10 px-2.5 py-1 rounded-full">Session A</span>
                    <h3 className="text-xl font-bold text-white mt-2">{sessionA.company}</h3>
                    <p className="text-xs text-[#a5a0c4]">{sessionA.role}</p>
                  </div>
                  <div className="text-right text-xs text-[#5c5875] flex items-center gap-1.5">
                    <Calendar size={14} />
                    {sessionA.created_at ? new Date(sessionA.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>

                {/* Score panel */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#8b5cf6] mb-1"><Trophy size={18} className="mx-auto" /></div>
                    <div className="text-2xl font-bold text-white">{(sessionA.final_score || 0).toFixed(0)}%</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1">Final Score</div>
                  </div>
                  
                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#10b981] mb-1"><Target size={18} className="mx-auto" /></div>
                    <div className="text-2xl font-bold text-white">{(sessionA.accuracy || 0).toFixed(0)}%</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1">Accuracy</div>
                  </div>

                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#a5a0c4] mb-1"><Clock size={18} className="mx-auto" /></div>
                    <div className="text-sm font-bold text-white py-1">{formatTime(sessionA.time_taken || 0)}</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1.5">Time Taken</div>
                  </div>
                </div>

                {/* Readiness Score */}
                <div className="bg-[#0a0a0f] p-5 rounded-xl border border-[#2d2c41]">
                  <div className="flex justify-between text-xs font-bold text-[#a5a0c4] mb-2 uppercase tracking-wider">
                    <span>Readiness Score</span>
                    <span className="text-[#8b5cf6]">{(sessionA.readiness_score || 0).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2d2c41] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-full" style={{ width: `${sessionA.readiness_score || 0}%` }} />
                  </div>
                </div>

                {/* Persona */}
                <div className="bg-[#0a0a0f]/50 p-4 rounded-xl border border-[#2d2c41] flex items-center gap-3">
                  <ShieldCheck size={20} className="text-[#fbbf24]" />
                  <div>
                    <div className="text-[10px] text-[#5c5875] font-bold uppercase">Persona Context</div>
                    <div className="text-sm font-bold text-white">{sessionA.interviewer_persona || "Standard Recruiter"}</div>
                  </div>
                </div>

                {/* Weak Areas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#a5a0c4] uppercase tracking-wider">Weak Areas Identified</h4>
                  <div className="flex flex-wrap gap-2">
                    {(sessionA.weak_areas || []).map((wa: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-medium text-[#ff6b6b] border border-[#ff6b6b]/20 bg-[#ff6b6b]/5 rounded-md">
                        {wa}
                      </span>
                    ))}
                    {(sessionA.weak_areas || []).length === 0 && (
                      <div className="text-xs text-[#5c5875] italic">No critical weak areas.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session B details */}
              <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6 space-y-6">
                <div className="border-b border-[#2d2c41] pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#a5a0c4] uppercase tracking-wider bg-[#2d2c41] px-2.5 py-1 rounded-full">Session B</span>
                    <h3 className="text-xl font-bold text-white mt-2">{sessionB.company}</h3>
                    <p className="text-xs text-[#a5a0c4]">{sessionB.role}</p>
                  </div>
                  <div className="text-right text-xs text-[#5c5875] flex items-center gap-1.5">
                    <Calendar size={14} />
                    {sessionB.created_at ? new Date(sessionB.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>

                {/* Score panel */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#8b5cf6] mb-1"><Trophy size={18} className="mx-auto" /></div>
                    <div className="text-2xl font-bold text-white">{(sessionB.final_score || 0).toFixed(0)}%</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1">Final Score</div>
                  </div>
                  
                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#10b981] mb-1"><Target size={18} className="mx-auto" /></div>
                    <div className="text-2xl font-bold text-white">{(sessionB.accuracy || 0).toFixed(0)}%</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1">Accuracy</div>
                  </div>

                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#2d2c41] text-center">
                    <div className="text-[#a5a0c4] mb-1"><Clock size={18} className="mx-auto" /></div>
                    <div className="text-sm font-bold text-white py-1">{formatTime(sessionB.time_taken || 0)}</div>
                    <div className="text-[9px] text-[#5c5875] font-semibold uppercase tracking-wider mt-1.5">Time Taken</div>
                  </div>
                </div>

                {/* Readiness Score */}
                <div className="bg-[#0a0a0f] p-5 rounded-xl border border-[#2d2c41]">
                  <div className="flex justify-between text-xs font-bold text-[#a5a0c4] mb-2 uppercase tracking-wider">
                    <span>Readiness Score</span>
                    <span className="text-[#8b5cf6]">{(sessionB.readiness_score || 0).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2d2c41] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-full" style={{ width: `${sessionB.readiness_score || 0}%` }} />
                  </div>
                </div>

                {/* Persona */}
                <div className="bg-[#0a0a0f]/50 p-4 rounded-xl border border-[#2d2c41] flex items-center gap-3">
                  <ShieldCheck size={20} className="text-[#fbbf24]" />
                  <div>
                    <div className="text-[10px] text-[#5c5875] font-bold uppercase">Persona Context</div>
                    <div className="text-sm font-bold text-white">{sessionB.interviewer_persona || "Standard Recruiter"}</div>
                  </div>
                </div>

                {/* Weak Areas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#a5a0c4] uppercase tracking-wider">Weak Areas Identified</h4>
                  <div className="flex flex-wrap gap-2">
                    {(sessionB.weak_areas || []).map((wa: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-medium text-[#ff6b6b] border border-[#ff6b6b]/20 bg-[#ff6b6b]/5 rounded-md">
                        {wa}
                      </span>
                    ))}
                    {(sessionB.weak_areas || []).length === 0 && (
                      <div className="text-xs text-[#5c5875] italic">No critical weak areas.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
