"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, fetchAnalyticsSummary, fetchCurrentStreak } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, BarChart3, TrendingUp, Award, Target, Activity, Clock3, Users, Flame } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#c084fc"];

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    fetchData(sessionId);
  }, [router]);

  const fetchData = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [sessionRes, summaryRes, streakRes] = await Promise.all([
        api.get(`/chat/session/${sessionId}`),
        fetchAnalyticsSummary(),
        fetchCurrentStreak(),
      ]);
      setSession(sessionRes.data);
      setSummary(summaryRes);
      setStreak(streakRes);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load analytics right now.");
    } finally {
      setLoading(false);
    }
  };

  const readinessTrend = useMemo(() => {
    return (summary?.recent_trend || []).map((item: any, index: number) => ({
      name: item.date ? format(parseISO(item.date), "MMM d") : `S${index + 1}`,
      score: Number(item.score || 0),
      company: item.company || "Session",
    }));
  }, [summary]);

  const weakAreas = useMemo(() => summary?.weak_area_counts || [], [summary]);
  const companyCounts = useMemo(() => summary?.company_counts || [], [summary]);

  if (loading || !session || !summary) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const latestReadiness = Number(summary.latest_readiness || session.readiness_score || 0);
  const averageReadiness = Number(summary.average_readiness || 0);
  const change = Number(summary.readiness_change || 0);
  const completionRate = Number(summary.completion_rate || 0);
  const averageTime = Number(summary.average_time_taken || 0);
  const topCompany = summary.top_company || session.company || "Unknown";

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-accent" size={24} />
            Performance Analytics
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">
            Real session history from your placement prep workflow.
          </p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1280px] mx-auto w-full space-y-8">
        {error && (
          <div className="border border-[#ef4444]/30 bg-[#ef4444]/10 rounded-xl p-4 text-sm text-[#fca5a5]">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard icon={Award} label="Latest readiness" value={`${latestReadiness.toFixed(0)}%`} sublabel={`${session.company} · ${session.role}`} />
          <MetricCard icon={TrendingUp} label="Average readiness" value={`${averageReadiness.toFixed(1)}%`} sublabel={change >= 0 ? `+${change.toFixed(1)} vs previous` : `${change.toFixed(1)} vs previous`} />
          <MetricCard icon={Activity} label="Total sessions" value={String(summary.total_sessions || 0)} sublabel={`${summary.completed_sessions || 0} completed`} />
          <MetricCard icon={Target} label="Completion rate" value={`${completionRate.toFixed(1)}%`} sublabel="Completed roadmap tasks" />
          <MetricCard icon={Clock3} label="Avg. time" value={formatTime(averageTime)} sublabel="Across saved sessions" />
          <MetricCard icon={Flame} label="Current streak" value={`${streak?.current_streak ?? 0} days`} sublabel={streak?.current_streak ?? 0 > 0 ? `Best: ${streak?.best_streak ?? 0} days` : "Keep studying!"} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-[#12121a] border border-[#2d2c41] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Readiness trend</h2>
                <p className="text-sm text-[#a5a0c4] mt-1">How your readiness has changed across recent sessions.</p>
              </div>
              <div className="text-right text-sm text-[#a5a0c4]">
                <div className="font-semibold text-white">Top tracked company</div>
                <div>{topCompany}</div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readinessTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2c41" />
                  <XAxis dataKey="name" tick={{ fill: "#a5a0c4", fontSize: 12 }} axisLine={{ stroke: "#2d2c41" }} tickLine={false} />
                  <YAxis tick={{ fill: "#a5a0c4", fontSize: 12 }} axisLine={{ stroke: "#2d2c41" }} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#12121a", border: "1px solid #2d2c41", borderRadius: 12, color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Readiness"]}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-[#06b6d4]" size={20} />
              <h2 className="text-xl font-bold text-white tracking-tight">Company mix</h2>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={companyCounts} dataKey="count" nameKey="company" cx="50%" cy="50%" outerRadius={110} label={(entry: any) => `${entry.company}`.slice(0, 10)}>
                    {companyCounts.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#12121a", border: "1px solid #2d2c41", borderRadius: 12, color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Most frequent weak areas</h2>
            <p className="text-sm text-[#a5a0c4] mb-6">These are the topics that repeatedly appear in your generated gap analysis.</p>
            {weakAreas.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weakAreas} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2c41" />
                    <XAxis type="number" tick={{ fill: "#a5a0c4", fontSize: 12 }} axisLine={{ stroke: "#2d2c41" }} tickLine={false} />
                    <YAxis dataKey="topic" type="category" tick={{ fill: "#a5a0c4", fontSize: 12 }} width={140} axisLine={{ stroke: "#2d2c41" }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#12121a", border: "1px solid #2d2c41", borderRadius: 12, color: "#fff" }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-[#a5a0c4] text-sm rounded-xl border border-[#2d2c41] bg-[#0a0a0f] p-6">
                No weak areas were recorded yet. Run a new setup workflow to generate a richer analytics view.
              </div>
            )}
          </div>

          <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Actionable insights</h2>
            <p className="text-sm text-[#a5a0c4] mb-6">Derived from your saved sessions, not fabricated from a single score.</p>
            <div className="grid grid-cols-1 gap-4">
              <InsightCard
                title="Consistency check"
                tone="green"
                body={`You have ${summary.total_sessions || 0} saved sessions and ${summary.completed_sessions || 0} completed runs. Keep your prep cadence steady to raise the average readiness beyond ${averageReadiness.toFixed(1)}%.`}
              />
              <InsightCard
                title="Fastest payoff"
                tone="amber"
                body={weakAreas.length > 0 ? `The most repeated gap is ${weakAreas[0].topic}. Prioritize it first in your roadmap for the biggest improvement return.` : "No repeated weak area data is available yet, so the next run should focus on building your question bank and gap profile."}
              />
              <InsightCard
                title="Target focus"
                tone="violet"
                body={`Your current active session is ${session.company} · ${session.role}. Use this analytics view to compare future runs against that baseline.`}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: any;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="bg-[#12121a] border border-[#2d2c41] rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-[40px] rounded-full pointer-events-none" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#a5a0c4] font-semibold">{label}</div>
          <div className="text-3xl font-bold text-white mt-2">{value}</div>
          <div className="text-xs text-[#7c7899] mt-2">{sublabel}</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "green" | "amber" | "violet";
}) {
  const toneClasses = {
    green: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20",
    amber: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    violet: "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20",
  };

  return (
    <div className="bg-[#0a0a0f] border border-[#2d2c41] rounded-xl p-5">
      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${toneClasses[tone]} mb-3`}>
        {title}
      </div>
      <p className="text-sm text-[#a5a0c4] leading-relaxed">{body}</p>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
