"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WORKFLOW_NODES = [
  "resume_analysis",
  "rag_retrieval",
  "weak_area_scan",
  "study_plan",
  "mock_questions",
  "eval_engine",
];

const WORKFLOW_LABELS: Record<string, string> = {
  resume_analysis: "Resume analysis",
  rag_retrieval: "Interview data retrieval",
  weak_area_scan: "Weak-area scan",
  study_plan: "Roadmap generation",
  mock_questions: "Question generation",
  eval_engine: "Answer evaluation",
};

interface AgentState {
  readinessScore: number | null;
  weakAreas: string[] | null;
  studyPlan: any | null;
  mockQuestions: any[] | null;
  currentQuestionIndex: number;
  ragCount: number;
  resumeAnalysis: any | null;
  workflowStep: string;
}

interface Props {
  agentState: AgentState;
  completedNodes: string[];
  activeNode: string;
}

export default function AgentStatePanel({ agentState, completedNodes, activeNode }: Props) {
  const score = agentState.readinessScore;
  const status =
    score == null ? "Preparing" : score >= 75 ? "Strong" : score >= 55 ? "Improving" : "Needs focus";

  return (
    <aside className="w-[340px] glass-panel border-l border-white/[0.05] flex flex-col overflow-hidden flex-shrink-0 relative z-20">
      <div className="px-6 py-5 border-b border-white/[0.05] bg-black/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(124,106,255,0.8)]"></span>
          Preparation Console
        </div>
        <div className="text-[11px] text-[#8e89b2] mt-1.5 font-medium leading-relaxed">Live workflow orchestration and session metrics telemetry</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Mock Questions" value={agentState.mockQuestions?.length || 0} />
          <Metric label="RAG Sources" value={agentState.ragCount} />
        </div>

        <motion.div 
          initial={false}
          animate={{ scale: score != null ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card border border-white/[0.05] rounded-xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent2/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-[#8e89b2] uppercase tracking-widest">
              Readiness Score
            </span>
            <span className="text-[10px] font-bold font-mono text-accent2 uppercase tracking-widest bg-accent2/10 px-2 py-0.5 rounded border border-accent2/20">{status}</span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-[#a5a0c4] tracking-tight">
              {score == null ? "--" : Math.round(score)}
            </span>
            <span className="text-sm font-bold text-[#5c5875] mb-1.5 font-mono">/ 100</span>
          </div>
          <div className="mt-4 h-2 bg-[#111019] rounded-full overflow-hidden border border-[#2d2c41] shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-accent2 shadow-[0_0_10px_rgba(79,217,179,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(score ?? 0, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <div className="glass-card border border-white/[0.05] rounded-xl p-5">
          <div className="text-[10px] font-bold font-mono text-[#8e89b2] uppercase tracking-widest mb-4">
            Workflow Telemetry
          </div>
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#2d2c41] before:to-transparent">
            {WORKFLOW_NODES.slice(0, 5).map((node, index) => {
              const isDone = completedNodes.includes(node);
              const isActive = activeNode === node && !isDone;
              return (
                <motion.div 
                  key={node} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#181724] bg-[#0c0c12] group-[.is-active]:bg-accent/20 text-slate-500 group-[.is-active]:text-emerald-50 text-xs font-semibold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                    {isDone ? (
                      <CheckCircle2 size={14} className="text-accent2" />
                    ) : isActive ? (
                      <Loader2 size={14} className="text-accent animate-spin" />
                    ) : (
                      <Circle size={10} className="text-[#2d2c41] fill-[#2d2c41]" />
                    )}
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-2 rounded border border-white/[0.02] bg-white/[0.01] shadow-sm transition-all duration-300 hover:bg-white/[0.03]">
                    <span className={`text-[11px] font-mono font-semibold tracking-tight ${isDone ? "text-[#a5a0c4]" : isActive ? "text-white" : "text-[#5c5875]"}`}>
                      {WORKFLOW_LABELS[node]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {agentState.weakAreas && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="glass-card border border-white/[0.05] rounded-xl p-5 overflow-hidden"
            >
              <div className="text-[10px] font-bold font-mono text-[#8e89b2] uppercase tracking-widest mb-4">
                Discovered Focus Areas
              </div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(agentState.weakAreas) ? agentState.weakAreas : typeof agentState.weakAreas === 'string' ? [agentState.weakAreas] : []).slice(0, 8).map((area: string, index: number) => (
                  <motion.span
                    key={`${area}-${index}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05, type: "spring" as any }}
                    className="text-[10px] font-bold font-mono bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ff6b6b] px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(255,107,107,0.1)]"
                  >
                    {String(area)}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
      <div className="text-[9px] font-bold font-mono text-[#8e89b2] uppercase tracking-widest">{label}</div>
      <motion.div 
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white mt-2 tracking-tight"
      >
        {value}
      </motion.div>
    </div>
  );
}
