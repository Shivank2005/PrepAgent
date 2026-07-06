"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, updateSessionTasks } from "@/lib/api";
import { getActiveSessionId, getAuthToken } from "@/lib/store";
import { Loader2, BookOpen, Clock, Target, CheckCircle2, Circle, ChevronRight } from "lucide-react";

export default function RoadmapPage() {
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
      const s = res.data;
      setSession(s);
      

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

  const { study_plan, completed_tasks } = session;
  
  // Format the study plan phases
  let phases: any[] = [];
  if (study_plan && study_plan.phases) {
    phases = study_plan.phases;
  } else if (Array.isArray(study_plan)) {
    phases = [{ name: "General Prep", tasks: study_plan }];
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#2d2c41] bg-[#0a0a0f] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-[#8b5cf6]" size={24} />
            Personalized Study Plan
          </h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Your AI-generated roadmap to interview success.</p>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1000px] mx-auto w-full space-y-8">
        {phases.length === 0 ? (
          <div className="text-center text-[#a5a0c4] py-12">
            No study plan available. Please configure your interview setup again.
          </div>
        ) : (
          <div className="space-y-10">
            {phases.map((phase: any, phaseIndex: number) => (
              <div key={phaseIndex} className="relative pl-4 border-l-2 border-[#2d2c41] pb-4">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-[#8b5cf6]"></div>
                
                <h2 className="text-xl font-bold text-white mb-2 ml-4 flex items-center gap-2">
                  <Target className="text-[#8b5cf6]" size={18} />
                  {phase.name}
                </h2>
                
                {phase.focus_areas && (
                  <p className="text-[#a5a0c4] text-sm mb-6 ml-4">
                    <span className="font-semibold text-white">Focus:</span> {phase.focus_areas.join(', ')}
                  </p>
                )}

                <div className="ml-4 space-y-3 mt-4">
                  {(phase.tasks || []).map((taskItem: any, taskIndex: number) => {
                    const taskName = typeof taskItem === 'string' ? taskItem : taskItem.name || 'Unknown task';
                    const isCompleted = !!completed_tasks?.[taskName];
                    const isMock = taskName.toLowerCase().includes("mock");

                    return (
                      <div 
                        key={taskIndex} 
                        onClick={() => handleTaskToggle(taskName)}
                        className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-[#181724]/30 border-[#10b981]/30 opacity-70' 
                            : 'bg-[#12121a] border-[#2d2c41] hover:border-[#8b5cf6]/50'
                        }`}
                      >
                        <div className="mt-0.5 text-[#5c5875] group-hover:text-[#8b5cf6] transition-colors">
                          {isCompleted ? (
                            <CheckCircle2 className="text-[#10b981]" size={20} />
                          ) : (
                            <Circle size={20} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`text-base font-semibold mb-1 ${isCompleted ? 'text-white line-through' : 'text-white'}`}>
                            {taskName}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-[#a5a0c4]">
                            {isMock ? (
                              <span className="flex items-center gap-1 bg-[#10b981]/10 text-[#10b981] px-2 py-0.5 rounded font-medium">
                                Mock Session
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 bg-[#8b5cf6]/10 text-[#c084fc] px-2 py-0.5 rounded font-medium">
                                Study
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-[#5c5875]" /> ~ 1 Hour
                            </span>
                          </div>
                        </div>
                        
                        <ChevronRight className={`text-[#2d2c41] transition-transform ${isCompleted ? 'translate-x-1 text-[#10b981]' : 'group-hover:translate-x-1 group-hover:text-[#8b5cf6]'}`} size={20} />
                      </div>
                    );
                  })}
                  {(!phase.tasks || phase.tasks.length === 0) && (
                    <div className="text-[#a5a0c4] text-sm italic">No specific tasks defined for this phase.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
