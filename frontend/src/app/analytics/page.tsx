"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, BarChart3, TrendingUp, Award, Target } from "lucide-react";

export default function AnalyticsPage() {
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
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  // Derive mock data for visual representation from actual readiness score
  const baseScore = session.readiness_score || 50;
  
  const metrics = [
    { label: "Technical Competence", score: Math.min(100, baseScore + 5) },
    { label: "Communication", score: Math.min(100, baseScore + 12) },
    { label: "Problem Solving", score: Math.min(100, baseScore - 5) },
    { label: "System Design", score: Math.min(100, baseScore - 15) },
    { label: "Behavioral", score: Math.min(100, baseScore + 20) },
  ];

  // Radar chart calculations
  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 40;
  const points = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    const value = (m.score / 100) * radius;
    return {
      x: center + value * Math.cos(angle),
      y: center + value * Math.sin(angle),
      labelX: center + (radius + 25) * Math.cos(angle),
      labelY: center + (radius + 25) * Math.sin(angle),
    };
  });
  
  const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z";

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-accent" size={24} />
            Performance Analytics
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Deep dive into your interview readiness metrics.</p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Main Score Card */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
          <Award className="text-accent mb-4" size={48} />
          <h2 className="text-lg font-medium text-[#a5a0c4] mb-2 uppercase tracking-widest">Overall Readiness</h2>
          <div className="text-7xl font-bold text-white tracking-tighter mb-4">
            {baseScore.toFixed(0)}<span className="text-3xl text-[#5c5875]">%</span>
          </div>
          <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <TrendingUp size={16} /> Top 24% of candidates
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-8 flex flex-col items-center justify-center relative">
          <h3 className="absolute top-8 left-8 font-bold text-white text-lg">Skill Breakdown</h3>
          
          <div className="relative mt-12 w-[300px] h-[300px]">
            <svg width={size} height={size} className="overflow-visible">
              {/* Background webs */}
              {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
                <polygon
                  key={idx}
                  points={metrics.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
                    return `${center + radius * scale * Math.cos(angle)},${center + radius * scale * Math.sin(angle)}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#2d2c41"
                  strokeWidth="1"
                />
              ))}
              
              {/* Axis lines */}
              {metrics.map((_, i) => {
                const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + radius * Math.cos(angle)}
                    y2={center + radius * Math.sin(angle)}
                    stroke="#2d2c41"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data polygon */}
              <path
                d={pathData}
                fill="rgba(6, 182, 212, 0.2)"
                stroke="#06b6d4"
                strokeWidth="2"
                className="drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              />

              {/* Data points */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#06b6d4" />
              ))}
            </svg>
            
            {/* Labels */}
            {points.map((p, i) => (
              <div
                key={i}
                className="absolute text-xs font-bold text-[#a5a0c4] transform -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
                style={{ left: p.labelX, top: p.labelY }}
              >
                {metrics[i].label}
                <div className="text-white">{metrics[i].score.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="lg:col-span-2 bg-[#12121a] border border-[#2d2c41] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
             <Target className="text-[#fbbf24]" size={24} />
             <h2 className="text-xl font-bold text-white tracking-tight">Actionable Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0a0f] border border-[#2d2c41] rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#4fd9b3] uppercase tracking-wider mb-2">Strengths to Leverage</h4>
              <p className="text-sm text-[#a5a0c4] leading-relaxed">
                Your <strong className="text-white">Behavioral</strong> and <strong className="text-white">Communication</strong> scores are exceptionally high. Make sure to lean into these during the interview by telling compelling stories and clearly explaining your thought process.
              </p>
            </div>
            <div className="bg-[#0a0a0f] border border-[#2d2c41] rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#ff6b6b] uppercase tracking-wider mb-2">Critical Bottlenecks</h4>
              <p className="text-sm text-[#a5a0c4] leading-relaxed">
                Your <strong className="text-white">System Design</strong> capability is currently lagging at {metrics[3].score.toFixed(0)}%. Since you are applying for <strong className="text-white">{session.role}</strong> at <strong className="text-white">{session.company}</strong>, this will be heavily scrutinized. Prioritize the System Design modules in your Study Plan.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
