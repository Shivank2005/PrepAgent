"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Bell, AlertTriangle, Timer, TrendingUp, Target, Flame, CheckSquare, AlertCircle, Loader2, PlayCircle, ChevronRight, Clock, Target as TargetIcon } from "lucide-react";
import Link from "next/link";
import { api, updateSessionTasks, fetchAnalyticsSummary, fetchCurrentStreak, fetchCompanyFocusList } from "@/lib/api";
import { getActiveSessionId, getAuthToken, setActiveSessionId } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [focusCompanies, setFocusCompanies] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<number[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    const initDashboard = async () => {
      const sessionId = getActiveSessionId();
      if (sessionId) {
        await fetchSession(sessionId);
      } else {
        try {
          const historyRes = await api.get('/sessions/history');
          if (historyRes.data && historyRes.data.length > 0) {
            // Use the most recent session's ID (history is usually returned descending, but backend does reverse in fetchSession. Let's just fetch history directly)
            const latestSession = historyRes.data[historyRes.data.length - 1];
            setActiveSessionId(latestSession.id);
            await fetchSession(latestSession.id);
          } else {
            router.push("/setup");
          }
        } catch (err) {
          router.push("/setup");
        }
      }
    };
    initDashboard();
  }, [router]);

  const fetchSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/session/${sessionId}`);
      setSession(res.data);
      
      const historyRes = await api.get('/sessions/history');
      setSessionHistory(historyRes.data.reverse());
      
      const summaryRes = await fetchAnalyticsSummary();
      setSummary(summaryRes);
      
      const streakRes = await fetchCurrentStreak();
      setStreak(streakRes);
      
      const focusRes = await fetchCompanyFocusList();
      setFocusCompanies(focusRes.focus_companies || []);
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

  const handleTaskToggle = async (taskName: string) => {
    if (!session) return;
    const newCompleted = { ...session.completed_tasks, [taskName]: !session.completed_tasks?.[taskName] };
    setSession({ ...session, completed_tasks: newCompleted });
    try {
      await updateSessionTasks(session.session_id, newCompleted);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
      </div>
    );
  }

  const { company, role, timeline_days, readiness_score, weak_areas, study_plan, completed_tasks } = session;
  
  // Backend returns { phases: [{ name, days, tasks: [] }] }
  const plan = Array.isArray(study_plan) 
    ? study_plan 
    : (study_plan?.phases || []).flatMap((p: any, i: number) => 
        (p.tasks || []).map((t: any, j: number) => {
          const taskName = typeof t === 'string' ? t : (t.name || 'Unknown task');
          const duration = typeof t === 'object' && t.duration_mins ? t.duration_mins : 45;
          return {
            task: taskName, 
            duration: duration,
            day: j + 1 + (i * 3), // rough day estimation
            phase: p.name 
          };
        })
      );

  const completedCount = Object.values(completed_tasks || {}).filter(Boolean).length;
  const completionPct = plan.length ? Math.round((completedCount / plan.length) * 100) : 0;
  
  const criticalGaps = (weak_areas || []).slice(0, 3);
  const activeSessionHistory = sessionHistory.find((s: any) => s.id === session.session_id);
  const createdAt = activeSessionHistory ? new Date(activeSessionHistory.created_at || Date.now()) : new Date();
  const daysElapsed = Math.max(0, Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24)));
  const expectedPct = (timeline_days || 1) > 0 ? (daysElapsed / (timeline_days || 1)) * 100 : 100;
  
  // Consider them lagging if they are more than 5% behind the expected completion for today
  const isLagging = daysElapsed > 0 && completionPct < (expectedPct - 5);
  
  const hasCriticalGaps = criticalGaps.length > 0 && isLagging;
  
  const totalGaps = weak_areas?.length || 0;
  const coveredGaps = Math.floor(totalGaps * (completionPct / 100));

  const todayTasks = plan.filter((task: any) => {
    const isCompleted = !!completed_tasks?.[task.task];
    const isDueToday = task.day === daysElapsed + 1;
    const isOverdue = (task.day || 0) < daysElapsed + 1 && !isCompleted;
    return isDueToday || isOverdue;
  });
  const todayCompletedCount = todayTasks.filter((t: any) => !!completed_tasks?.[t.task]).length;
  const todayCompletionPct = todayTasks.length ? Math.round((todayCompletedCount / todayTasks.length) * 100) : 100;

  // Adaptive Frontend Mappings for Data not provided by backend
  const phaseProgress = (study_plan?.phases || []).map((p: any) => {
    const pTasks = p.tasks || [];
    const max = pTasks.length;
    const val = pTasks.filter((t: any) => {
      const taskName = typeof t === 'string' ? t : (t as any).name || 'Unknown task';
      return completed_tasks?.[taskName];
    }).length;
    return { label: p.name.substring(0, 15), val, max: max || 1, originalName: p.name };
  });
  const fallbackBars = [
    { label: 'DSA', val: 8, max: 10 },
    { label: 'OOP Design', val: 1, max: 3 },
    { label: 'System Design', val: 0, max: 2 },
  ];
  const activePhaseProgress = phaseProgress.length > 0 ? phaseProgress : fallbackBars;

  const topicAccuracyData = phaseProgress.map((p: any) => {
    const isWeak = (weak_areas || []).some((w: any) => {
      const topicStr = typeof w === 'string' ? w : w.topic || '';
      if (!topicStr || !p.originalName) return false;
      return p.originalName.toLowerCase().includes(topicStr.toLowerCase()) || topicStr.toLowerCase().includes(p.originalName.toLowerCase());
    });
    
    // Dynamic Score calculation based on actual progress:
    // Start with a base score (lower if it's a weak area).
    const baseScore = isWeak ? 40 : 70;
    // Add bonus points based on the percentage of tasks completed in this topic
    const progressBonus = (p.val / p.max) * (isWeak ? 50 : 25);
    const val = Math.min(100, Math.round(baseScore + progressBonus));
    
    let color = '#10b981';
    if (val < 55) color = '#ef4444';
    else if (val < 75) color = '#f59e0b';
    
    return { label: p.label, val, color };
  });
  const fallbackTopics = [
    { label: 'Arrays', val: 85, color: '#10b981' },
    { label: 'Graphs', val: 60, color: '#f59e0b' },
    { label: 'DP', val: 42, color: '#ef4444' }
  ];
  const activeTopicAccuracy = topicAccuracyData.length > 0 ? topicAccuracyData : fallbackTopics;

  // Extract real scores from session history
  let scoreTrend = sessionHistory.map((s: any) => s.final_score ?? s.readiness_score ?? 0);
  
  // To avoid division by zero when calculating X coordinates (if length <= 1)
  if (scoreTrend.length === 0) {
    scoreTrend = [0, 0];
  } else if (scoreTrend.length === 1) {
    scoreTrend = [scoreTrend[0], scoreTrend[0]];
  }
  const scoreTrendData = scoreTrend.map((s, i) => {
    const origSession = sessionHistory[Math.min(i, sessionHistory.length - 1)] || null;
    const label = origSession ? `Session ${Math.min(i, sessionHistory.length - 1) + 1}: ${origSession.company || 'Mock'}` : `Session ${i + 1}`;
    
    return { name: `S${i + 1}`, val: s, label, attempts: sessionHistory.length };
  });

  const recentSessionsData = sessionHistory.map((s: any) => {
    const timeTaken = s.time_taken || 0;
    const durStr = timeTaken > 0 
      ? (timeTaken < 60 ? `${timeTaken} s` : `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`)
      : '0 s';
    const finalScore = s.final_score ?? s.readiness_score ?? 0;
    return {
      date: new Date(s.created_at || Date.now()).toLocaleDateString(),
      topic: s.company || 'Technical',
      round: s.role || 'Medium',
      qs: 10,
      dur: durStr,
      score: finalScore.toFixed(0),
      scoreColor: finalScore > 75 ? 'text-[#10b981]' : finalScore > 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]',
      roundColor: 'bg-[#2d2c41] text-[#a5a0c4]'
    };
  });

  // Generate dynamic notifications from real analytics
  const allNotifications = [];
  
  const readinessChange = Number(summary?.readiness_change || 0);
  const hasImproved = readinessChange >= 0;
  if (readinessChange !== 0) {
    allNotifications.push({
      id: 1,
      title: hasImproved ? 'Readiness Up!' : 'Readiness Down',
      text: `Your latest score shifted by ${hasImproved ? '+' : ''}${readinessChange.toFixed(1)}% across ${summary?.total_sessions || 1} sessions.`,
      time: 'Latest run',
      color: hasImproved ? 'text-[#10b981]' : 'text-[#ef4444]',
      bg: hasImproved ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10',
      border: hasImproved ? 'border-[#10b981]/20' : 'border-[#ef4444]/20'
    });
  }
  
  const weakAreaCount = (summary?.weak_area_counts || []).length;
  if (weakAreaCount > 0) {
    const topWeak = summary.weak_area_counts[0];
    allNotifications.push({
      id: 2,
      title: 'Top Gap Identified',
      text: `${topWeak.topic} appears most often in your weak areas. Prioritize it next.`,
      time: 'From history',
      color: 'text-[#f59e0b]',
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/20'
    });
  }
  
  const completionRate = Number(summary?.completion_rate || completionPct);
  if (completionRate >= 50 && completionRate < 100) {
    allNotifications.push({
      id: 3,
      title: 'Milestone Reached',
      text: `You've completed ${completionRate.toFixed(0)}% of your roadmap tasks across all sessions.`,
      time: 'In progress',
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#8b5cf6]/10',
      border: 'border-[#8b5cf6]/20'
    });
  }
  
  allNotifications.push({
    id: 4,
    title: 'Plan Ready',
    text: `Your ${timeline_days}-day study plan is generated and ready to go. Run your first mock to start tracking progress.`,
    time: 'Recently',
    color: 'text-[#fbbf24]',
    bg: 'bg-[#fbbf24]/10',
    border: 'border-[#fbbf24]/20'
  });
  
  const notifications = allNotifications.filter(n => !dismissedNotifs.includes(n.id));

  const handleClearAll = () => {
    setDismissedNotifs([...dismissedNotifs, ...notifications.map(n => n.id)]);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-50">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">Progress Dashboard</h1>
            <div className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1.5 rounded-full text-xs font-medium text-[#c084fc] flex items-center gap-2">
              <TargetIcon size={14} />
              {company} · {role}
            </div>
          </div>
          <div className="text-sm text-[#5c5875] mt-1">Last updated · just now</div>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={() => fetchSession(session.session_id)} className="flex items-center gap-2 text-sm text-[#a5a0c4] hover:text-white transition-colors">
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link href="/setup" className="bg-[#181724] hover:bg-[#2d2c41] border border-[#2d2c41] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2">
            New Setup
          </Link>
          {session.status === "COMPLETED" ? (
            <button disabled className="bg-[#2d2c41] text-[#a5a0c4] font-medium px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 cursor-not-allowed">
              <CheckSquare size={16} />
              Session Completed
            </button>
          ) : (
            <Link href="/interview" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
               <div className="w-2 h-2 rounded-full bg-white/90 animate-pulse" />
               Resume Mock
            </Link>
          )}
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-[#a5a0c4] hover:text-white relative transition-colors p-1"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-[#0a0a0f]" />
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[#12121a] border border-[#2d2c41] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-fade-in origin-top-right">
                <div className="px-4 py-3 border-b border-[#2d2c41] flex items-center justify-between bg-[#181724]">
                  <h3 className="font-bold text-white">Notifications</h3>
                  <span className="text-xs font-medium bg-[#8b5cf6]/20 text-[#c084fc] px-2 py-0.5 rounded-full">{notifications.length} New</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-[#2d2c41]/50 hover:bg-[#181724]/50 transition-colors flex gap-3 cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${notif.bg} ${notif.border}`}>
                        <Bell size={14} className={notif.color} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-0.5">{notif.title}</div>
                        <div className="text-xs text-[#a5a0c4] leading-relaxed mb-1">{notif.text}</div>
                        <div className="text-[10px] text-[#5c5875] font-medium">{notif.time}</div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-[#5c5875] text-sm">
                      No new notifications.
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 text-center border-t border-[#2d2c41] bg-[#0a0a0f]">
                    <button onClick={handleClearAll} className="text-xs font-medium text-[#8b5cf6] hover:text-[#a855f7] transition-colors">Mark all as read</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1200px] mx-auto w-full space-y-6">
        
        {/* Warning Banner */}
        {hasCriticalGaps && (
          <div className="bg-[#3a2816]/20 border border-[#eab308]/30 rounded-xl p-4 flex items-start gap-4 text-[#fbbf24] shadow-sm">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-[#eab308]" />
            <div className="flex-1 text-sm leading-relaxed">
              <strong className="text-white">{criticalGaps.length} high-priority topics</strong> are behind schedule — {criticalGaps.map((g: any) => typeof g === 'string' ? g : g.topic || '').join(', ')}. Your interview is in <strong className="text-[#eab308]">{timeline_days} days.</strong>
            </div>
            <Link href="/roadmap" className="text-[#eab308] hover:text-white text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
              View Plan <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* Metric Cards Grid - 3x2 Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">DAYS UNTIL INTERVIEW</span>
              <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                <Timer size={18} className="text-[#fbbf24]" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#fbbf24] tracking-tight mb-2">{Math.max(0, timeline_days - daysElapsed)} <span className="text-lg font-medium text-[#777294]">days</span></div>
              <div className="text-sm text-[#5c5875]">{company} · {role} · {new Date(createdAt.getTime() + (timeline_days * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">AVG MOCK SCORE</span>
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-[#10b981]" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-2">{(readiness_score || 0).toFixed(1)}<span className="text-xl text-[#777294]">%</span></div>
              <div className="text-sm text-[#5c5875]">Based on resume analysis</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">GAP COVERAGE</span>
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <Target size={18} className="text-[#8b5cf6]" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-2">
                {coveredGaps} <span className="text-xl text-[#777294]">/{totalGaps}</span>
              </div>
              <div className="text-sm text-[#5c5875]">{totalGaps - coveredGaps} topics still open</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">STUDY STREAK</span>
              <div className="w-8 h-8 rounded-lg bg-[#ff6b6b]/10 flex items-center justify-center">
                <Flame size={18} className={streak?.current_streak ?? 0 > 0 ? "text-[#ff6b6b]" : "text-[#777294]"} />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-2">
                {streak?.current_streak ?? 0} <span className="text-lg font-medium text-[#777294]">days</span>
              </div>
              <div className="text-sm text-[#5c5875]">
                {streak?.current_streak ?? 0 > 0 
                  ? `Best: ${streak?.best_streak ?? 0} days` 
                  : `Last session: ${streak?.days_since_last ?? 0} days ago`}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">PLAN COMPLETION</span>
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <CheckSquare size={18} className="text-[#8b5cf6]" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-2">{completionPct}<span className="text-xl text-[#777294]">%</span></div>
              <div className="text-sm text-[#5c5875]">{completedCount} of {plan.length} tasks done</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs font-medium text-[#777294] uppercase tracking-wider">AT-RISK TOPICS</span>
              <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-[#ef4444]" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-bold text-[#ef4444] tracking-tight mb-2">{criticalGaps.length || 3}</div>
              <div className="text-sm text-[#5c5875]">Behind schedule</div>
              <div className="text-xs font-medium text-[#ef4444] mt-1">Needs attention</div>
            </div>
          </div>
          
        </div>

        {/* Actionable Gaps & Drills */}
        {weak_areas && weak_areas.length > 0 && (
          <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Gap Analysis to Action</h2>
                <div className="text-sm text-[#5c5875]">Your identified weaknesses and immediate practice drills.</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weak_areas.map((gap: any, i: number) => {
                const topicStr = typeof gap === 'string' ? gap : gap.topic || `Topic ${i + 1}`;
                return (
                  <div key={i} className="bg-[#1a1625] border border-[#2d2c41] rounded-lg p-5 flex flex-col justify-between hover:border-[#8b5cf6]/50 transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-[#f59e0b]" />
                        <h3 className="font-bold text-white text-base">{topicStr}</h3>
                      </div>
                      <p className="text-xs text-[#a5a0c4] mb-4">
                        Consistently appearing as a weak area in your mock sessions.
                      </p>
                    </div>
                    <Link 
                      href={`/drill/${encodeURIComponent(topicStr)}?session_id=${session.session_id}`}
                      className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Practice This Now <ChevronRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Mock Score Trend */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Mock Score Trend</h2>
              <div className="text-sm text-[#5c5875]">11 sessions · {company} {role}</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-[#a5a0c4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span> Score
              </div>
              <div className="flex items-center gap-2 text-sm text-[#a5a0c4]">
                <span className="w-6 border-b-2 border-dashed border-[#fbbf24]"></span> Target 75%
              </div>
            </div>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5c5875" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5c5875" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                          <div className="text-sm font-bold text-white mb-2">{data.label}</div>
                          <div className={`text-3xl font-black mb-1 ${data.val > 75 ? 'text-[#10b981]' : data.val > 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                            {data.val.toFixed(0)}%
                          </div>
                          <div className="text-xs text-[#5c5875]">
                            {data.attempts} attempts total
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#2d2c41', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5, fill: "#12121a", stroke: "#8b5cf6", strokeWidth: 3 }} activeDot={{ r: 8, fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Plan Progress (Circular + Bars) */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-8">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white tracking-tight">Study Plan Progress</h2>
            <div className="text-sm text-[#5c5875]">Day {daysElapsed + 1} of {timeline_days} · {company} {role}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-[#1e1a2b] border-[8px] border-[#2d2c41]">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 -m-[8px]" style={{ width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }}>
                <circle cx="80" cy="80" r="76" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeDasharray="477.5" strokeDashoffset={477.5 - (477.5 * completionPct) / 100} className="drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]" strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <div className="text-4xl font-bold text-white mb-1">{completionPct}%</div>
                <div className="text-xs text-[#a5a0c4]">Complete</div>
              </div>
            </div>
          </div>

          <div className="space-y-5 max-w-3xl mx-auto">
            {activePhaseProgress.map((bar: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 text-sm text-[#a5a0c4]">{bar.label}</div>
                <div className="flex-1 h-3 bg-[#2d2c41] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8b5cf6] rounded-full" style={{ width: `${(bar.val / bar.max) * 100}%` }} />
                </div>
                <div className="w-12 text-right text-sm text-[#5c5875] font-mono">{bar.val}/{bar.max}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Accuracy Bar Chart */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Topic Accuracy</h2>
              <div className="text-sm text-[#5c5875]">Across all mock sessions · {company} {role}</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-[#a5a0c4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Strong (≥75%)
              </div>
              <div className="flex items-center gap-2 text-sm text-[#a5a0c4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Developing (55–74%)
              </div>
              <div className="flex items-center gap-2 text-sm text-[#a5a0c4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Weak (&lt;55%)
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activeTopicAccuracy}>
                <PolarGrid stroke="#2d2c41" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#a5a0c4', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#5c5875', fontSize: 10 }} axisLine={false} tickCount={5} />
                <Radar name="Accuracy" dataKey="val" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#181724] border border-[#2d2c41] rounded-lg p-3 shadow-xl z-50">
                          <div className="text-sm font-bold text-white mb-1">{data.label}</div>
                          <div className="text-xl font-bold mb-1" style={{ color: data.color || '#8b5cf6' }}>{data.val}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Mock Sessions */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#2d2c41]">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Mock Sessions</h2>
              <div className="text-sm text-[#5c5875]">{sessionHistory.length} total sessions recorded</div>
            </div>
            <Link href="/setup" className="text-[#8b5cf6] text-sm font-medium hover:text-[#a855f7] flex items-center gap-1 transition-colors">
              New session <ChevronRight size={16} />
            </Link>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d2c41] bg-[#0a0a0f]/50">
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider">Topic</th>
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider">Round</th>
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider text-center">Questions</th>
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-medium text-[#777294] uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2c41]">
              {recentSessionsData.map((row: any, i: number) => {
                const isCurrent = session.session_id === sessionHistory[i].id;
                const s = sessionHistory[i];
                return (
                  <tr 
                    key={i} 
                    onClick={() => {
                      if (!isCurrent) {
                        localStorage.setItem("prepagent_active_session", s.id);
                        window.location.reload();
                      }
                    }}
                    className={`hover:bg-[#181724]/80 transition-colors cursor-pointer ${isCurrent ? 'bg-[#8b5cf6]/10 shadow-[inset_4px_0_0_#8b5cf6]' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm text-[#a5a0c4]">
                      {row.date}
                    </td>
                    <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{row.topic}</span>
                            {isCurrent && (
                              <span className="bg-[#8b5cf6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                            )}
                            {s.status === "COMPLETED" && (
                              <span className="bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#10b981]/30 uppercase tracking-wider">Completed</span>
                            )}
                            {s.status === "PAUSED" && (
                              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#f59e0b]/30 uppercase tracking-wider">Paused</span>
                            )}
                          </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${row.roundColor}`}>
                        {row.round}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a5a0c4] text-center">{row.qs}</td>
                    <td className="px-6 py-4 text-sm text-[#a5a0c4]">
                      <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#5c5875]" /> {row.dur}</div>
                    </td>
                    <td className={`px-6 py-4 text-base font-bold text-right ${row.scoreColor}`}>{row.score}%</td>
                  </tr>
                );
              })}
              {recentSessionsData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#5c5875] text-sm">
                    No mock questions generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Today's Tasks */}
        <div className="bg-[#12121a] border border-[#2d2c41] rounded-xl flex flex-col mb-12">
          
          {/* Focus Companies Section */}
          {focusCompanies.length > 0 && (
            <div className="p-6 border-b border-[#2d2c41]/50 bg-[#1a1625]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Your Focus Companies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {focusCompanies.map((company: any, i: number) => (
                    <div key={i} className="bg-[#12121a] border border-[#2d2c41] rounded-lg p-4 hover:border-[#8b5cf6]/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-white text-sm mb-1">{company.company}</div>
                          <div className="text-[11px] text-[#5c5875]">{company.attempts} attempts</div>
                        </div>
                        {company.current_streak > 0 && (
                          <div className="flex items-center gap-1 bg-[#ff6b6b]/10 text-[#ff6b6b] px-2 py-1 rounded text-[10px] font-bold border border-[#ff6b6b]/20">
                            <Flame size={10} />
                            {company.current_streak}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#5c5875]">Best</span>
                          <span className="text-[#10b981] font-bold">{company.best_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5c5875]">Latest</span>
                          <span className={company.latest_score > company.best_score - 10 ? "text-[#10b981]" : "text-[#ef4444]"} >{company.latest_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5c5875]">Change</span>
                          <span className={company.improvement >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                            {company.improvement >= 0 ? '+' : ''}{company.improvement}%
                          </span>
                        </div>
                      </div>
                      
                      <button className="w-full mt-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] text-[11px] font-bold py-2 rounded transition-all group-hover:bg-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/50">
                        Practice Again
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Tasks Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Tasks</h2>
                <div className="text-sm text-[#5c5875]">{todayCompletedCount}/{todayTasks.length} complete · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#c084fc] px-3 py-1 rounded-full text-xs font-bold">
                {todayCompletionPct}%
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-[#2d2c41] rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#8b5cf6] rounded-full" style={{ width: `${todayCompletionPct}%` }} />
            </div>
          </div>

          <div className="p-6 pt-2 space-y-5">
            {todayTasks.map((task: any, i: number) => {
              const isCompleted = !!completed_tasks?.[task.task];
              const isOverdue = (task.day || 0) < daysElapsed + 1 && !isCompleted;
              
              // Determine badge style
              const isMock = task.phase?.includes("Mock") || task.task?.includes("Mock");
              let badgeStyle = "bg-[#8b5cf6]/20 text-[#c084fc] border-[#8b5cf6]/30";
              let badgeText = "Study";
              if (isMock) {
                badgeStyle = "bg-[#10b981]/20 text-[#34d399] border-[#10b981]/30";
                badgeText = "Mock";
              }
              
              if (isCompleted) {
                 badgeStyle = "bg-[#2d2c41] text-[#a5a0c4] border-[#5c5875]/50";
                 if (badgeText === "Study") badgeText = "Review";
              }

              return (
                <div key={i} onClick={() => handleTaskToggle(task.task)} className={`flex gap-4 cursor-pointer group transition-opacity ${isCompleted ? 'opacity-50' : ''}`}>
                  <div className="mt-1 flex-shrink-0">
                    {/* Status Circle */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isCompleted ? 'border-[#10b981] bg-[#12121a] text-[#10b981]' 
                        : isOverdue ? 'border-[#ef4444] text-[#ef4444]' 
                        : 'border-[#5c5875] group-hover:border-[#8b5cf6]'}
                    `}>
                      {isCompleted && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      {!isCompleted && isOverdue && <AlertCircle size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className={`text-base font-bold mb-1.5 transition-colors
                      ${isOverdue ? 'text-[#ef4444]' : isCompleted ? 'text-white line-through' : 'text-white'}
                    `}>
                      {task.task}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-3 py-0.5 rounded-full font-medium border ${badgeStyle}`}>
                        {badgeText}
                      </span>
                      <span className="text-[#a5a0c4] flex items-center gap-1"><Clock size={12} className="text-[#5c5875]"/> {task.duration || 45} min</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-[#ef4444]' : isCompleted ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`} />
                    </div>
                    {isOverdue && <div className="text-xs font-medium text-[#ef4444] mt-2">Overdue</div>}
                  </div>
                </div>
              )
            })}
            
            {!todayTasks.length && (
               <div className="text-[#a5a0c4] text-sm">No tasks for today. You're all caught up!</div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
