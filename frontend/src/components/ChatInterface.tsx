"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Loader2,
  MessageSquareText,
  Send,
  Target,
  Timer,
  TrendingUp,
  Mic,
  MicOff,
} from "lucide-react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { evaluateAnswer, streamChat, updateSessionTasks, fetchSessionHistory } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area, AreaChart
} from "recharts";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import AgentStatePanel from "./AgentStatePanel";
import MessageBubble from "./MessageBubble";
import Navbar from "./Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface AgentState {
  readinessScore: number | null;
  weakAreas: string[] | null;
  studyPlan: any | null;
  mockQuestions: any[] | null;
  currentQuestionIndex: number;
  ragCount: number;
  resumeAnalysis: any | null;
  workflowStep: string;
  completedTasks: Record<string, boolean> | null;
}

interface Props {
  sessionId: string;
  company: string;
  role: string;
  timelineDays: number;
  resumeText?: string;
  onRestart?: (newCompany: string) => void;
}

type Tab = "dashboard" | "roadmap" | "mock" | "analytics" | "chat";

const WORKFLOW_NODES = [
  "resume_analysis",
  "rag_retrieval",
  "weak_area_scan",
  "study_plan",
  "mock_questions",
];

const WORKFLOW_LABELS: Record<string, string> = {
  resume_analysis: "Resume analysis",
  rag_retrieval: "Interview data retrieval",
  weak_area_scan: "Weak-area analysis",
  study_plan: "Roadmap storage",
  mock_questions: "Mock interview storage",
};

const EMPTY_STATE: AgentState = {
  readinessScore: null,
  weakAreas: null,
  studyPlan: null,
  mockQuestions: null,
  currentQuestionIndex: 0,
  ragCount: 0,
  resumeAnalysis: null,
  workflowStep: "resume_analysis",
  completedTasks: null,
};

export default function ChatInterface({ sessionId, company, role, timelineDays, resumeText, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I am your ${company} placement mentor. Use this chat for doubts, explanations, answer review, and strategy. Your roadmap, mock questions, and analytics are managed in the dashboard sections.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>(EMPTY_STATE);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<string>("resume_analysis");

  const [completedRoadmapTasks, setCompletedRoadmapTasks] = useState<Record<string, boolean>>({});
  const [mockAnswer, setMockAnswer] = useState("");
  const [evaluatingMock, setEvaluatingMock] = useState(false);
  const [mockFeedback, setMockFeedback] = useState<any | null>(null);
  const [showMockHint, setShowMockHint] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "analytics" && sessionHistory.length === 0) {
      fetchSessionHistory()
        .then((data) => setSessionHistory(data))
        .catch((err) => console.error("Failed to fetch session history:", err));
    }
  }, [activeTab]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runInitialFlow();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const roadmapPhases = agentState.studyPlan?.phases || [];
  const mockQuestions = agentState.mockQuestions || [];
  const currentQuestion = mockQuestions[agentState.currentQuestionIndex];
  const totalRoadmapTasks = roadmapPhases.reduce((sum: number, phase: any) => sum + (phase.tasks?.length || 0), 0);
  const completedTaskCount = Object.values(completedRoadmapTasks).filter(Boolean).length;
  const roadmapProgress = totalRoadmapTasks ? Math.round((completedTaskCount / totalRoadmapTasks) * 100) : 0;

  const questionStats = useMemo(() => {
    return mockQuestions.reduce(
      (acc: Record<string, number>, q: any) => {
        const type = q.type || "General";
        const difficulty = q.difficulty || "Unrated";
        acc[`type:${type}`] = (acc[`type:${type}`] || 0) + 1;
        acc[`difficulty:${difficulty}`] = (acc[`difficulty:${difficulty}`] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [mockQuestions]);

  // Load tasks on init / session change
  useEffect(() => {
    if (agentState.completedTasks) {
      setCompletedRoadmapTasks(agentState.completedTasks);
    }
  }, [agentState.completedTasks]);

  // Persist tasks on change
  const prevTasksRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(completedRoadmapTasks);
    if (sessionId && serialized !== "{}" && serialized !== prevTasksRef.current) {
      prevTasksRef.current = serialized;
      updateSessionTasks(sessionId, completedRoadmapTasks).catch((e) => {
        console.error("Failed to persist tasks:", e);
      });
    }
  }, [completedRoadmapTasks, sessionId]);

  async function runInitialFlow() {
    setWorkflowRunning(true);
    setSetupError(null);

    try {
      for (let i = 0; i < WORKFLOW_NODES.length; i++) {
        const node = WORKFLOW_NODES[i];
        setActiveNode(node);
        await sleep(450 + i * 150);
        setCompletedNodes((prev) => Array.from(new Set([...prev, node])));
      }

      await streamChat(
        {
          session_id: sessionId,
          company,
          role,
          timeline_days: timelineDays,
          resume_text: resumeText,
          workflow_only: true,
          message: `Initialize placement preparation for ${company} ${role} in ${timelineDays} days.`,
        },
        (data) => {
          if (data.error) {
            setSetupError(data.error);
            setActiveNode("");
            return;
          }

          setAgentState({
            readinessScore: data.readiness_score,
            weakAreas: data.weak_areas,
            studyPlan: data.study_plan,
            mockQuestions: data.mock_questions,
            currentQuestionIndex: data.current_question_index || 0,
            ragCount: data.rag_count || 0,
            resumeAnalysis: data.resume_analysis,
            workflowStep: data.step || "done",
            completedTasks: data.completed_tasks || {},
          });
          setCompletedNodes(WORKFLOW_NODES);
          setActiveNode("");
          setSetupComplete(true);
        }
      );
    } catch (err: any) {
      setSetupError(
        err?.message ||
          "Unable to initialize the preparation workflow. Start the backend service and try again."
      );
      setActiveNode("");
    } finally {
      setWorkflowRunning(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading || !setupComplete) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }, { role: "assistant", content: "", isStreaming: true }]);
    setChatLoading(true);

    try {
      await streamChat(
        {
          session_id: sessionId,
          company,
          role,
          timeline_days: timelineDays,
          message: userMessage,
        },
        (data) => {
          if (data.error) {
            setMessages((prev) => replaceLastAssistant(prev, `Error from mentor chat: ${data.error}`));
            return;
          }

          if (data.token) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + data.token,
                  isStreaming: true,
                };
              }
              return next;
            });
            return;
          }

          if (data.assistant_message) {
            setMessages((prev) => replaceLastAssistant(prev, data.assistant_message));
          }

          setAgentState((prev) => ({
            ...prev,
            readinessScore: data.readiness_score ?? prev.readinessScore,
            weakAreas: data.weak_areas ?? prev.weakAreas,
            studyPlan: data.study_plan ?? prev.studyPlan,
            mockQuestions: data.mock_questions ?? prev.mockQuestions,
            currentQuestionIndex: data.current_question_index ?? prev.currentQuestionIndex,
            ragCount: data.step === "mentor_chat" ? prev.ragCount : data.rag_count ?? prev.ragCount,
            resumeAnalysis: data.resume_analysis ?? prev.resumeAnalysis,
            workflowStep: data.step ?? prev.workflowStep,
            completedTasks: data.completed_tasks ?? prev.completedTasks,
          }));
        }
      );
    } catch (err: any) {
      setMessages((prev) => replaceLastAssistant(prev, `Network error: ${err?.message || err}`));
    } finally {
      setChatLoading(false);
    }
  }

  async function submitMockAnswer() {
    if (!currentQuestion || !mockAnswer.trim()) return;

    setEvaluatingMock(true);
    try {
      const questionId = currentQuestion.id || currentQuestion.question_id || `q${agentState.currentQuestionIndex + 1}`;
      const data = await evaluateAnswer(sessionId, questionId, mockAnswer);
      setMockFeedback(data.feedback);
      setAgentState((prev) => ({
        ...prev,
        readinessScore: data.new_readiness_score,
      }));
    } catch (err: any) {
      setMockFeedback({
        score_delta: 0,
        score_label: "Not evaluated",
        feedback: err?.message || "The answer could not be evaluated. Check that the backend is running and the question has a valid id.",
        strengths: [],
        improvements: ["Retry the evaluation after checking the backend logs."],
      });
    } finally {
      setEvaluatingMock(false);
    }
  }

  function selectMockQuestion(index: number) {
    setMockFeedback(null);
    setMockAnswer("");
    setShowMockHint(false);
    setAgentState((prev) => ({ ...prev, currentQuestionIndex: index }));
  }

  function nextMockQuestion() {
    const nextIndex = Math.min(agentState.currentQuestionIndex + 1, Math.max(mockQuestions.length - 1, 0));
    selectMockQuestion(nextIndex);
  }

  return (
    <div className="flex flex-col h-screen bg-bg0 overflow-hidden text-[#e8e6f0]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        company={company}
      />

      <main className="flex flex-1 overflow-hidden">
        <section className="flex flex-col flex-1 overflow-hidden">
          <Topbar company={company} role={role} timelineDays={timelineDays} setupComplete={setupComplete} />

          {activeTab === "dashboard" && (
            <DashboardView
              agentState={agentState}
              company={company}
              role={role}
              timelineDays={timelineDays}
              setupComplete={setupComplete}
              setupError={setupError}
              workflowRunning={workflowRunning}
              completedNodes={completedNodes}
              activeNode={activeNode}
              roadmapProgress={roadmapProgress}
              setActiveTab={setActiveTab}
              onRestart={onRestart}
            />
          )}

          {activeTab === "roadmap" && (
            <RoadmapView
              studyPlan={agentState.studyPlan}
              completedRoadmapTasks={completedRoadmapTasks}
              setCompletedRoadmapTasks={setCompletedRoadmapTasks}
              workflowRunning={workflowRunning}
            />
          )}

          {activeTab === "mock" && (
            <MockInterviewView
              questions={mockQuestions}
              currentIndex={agentState.currentQuestionIndex}
              currentQuestion={currentQuestion}
              mockAnswer={mockAnswer}
              setMockAnswer={setMockAnswer}
              mockFeedback={mockFeedback}
              evaluatingMock={evaluatingMock}
              showMockHint={showMockHint}
              setShowMockHint={setShowMockHint}
              selectMockQuestion={selectMockQuestion}
              submitMockAnswer={submitMockAnswer}
              nextMockQuestion={nextMockQuestion}
              workflowRunning={workflowRunning}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              agentState={agentState}
              roadmapProgress={roadmapProgress}
              questionStats={questionStats}
              workflowRunning={workflowRunning}
              sessionHistory={sessionHistory}
            />
          )}

          {activeTab === "chat" && (
            <ChatView
              messages={messages}
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              chatLoading={chatLoading}
              setupComplete={setupComplete}
              messagesEndRef={messagesEndRef}
            />
          )}
        </section>

        <AgentStatePanel agentState={agentState} completedNodes={completedNodes} activeNode={activeNode} />
      </main>
    </div>
  );
}

function Topbar({
  company,
  role,
  timelineDays,
  setupComplete,
}: {
  company: string;
  role: string;
  timelineDays: number;
  setupComplete: boolean;
}) {
  return (
    <div className="border-b border-border bg-bg1 px-6 py-4 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-white">{company} Placement Dashboard</div>
        <div className="text-xs text-[#8e89b2] mt-1">{role}</div>
      </div>
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="inline-flex items-center gap-2 text-[#a5a0c4]">
          <Timer size={15} className="text-accent2" />
          {timelineDays} days
        </span>
        <span className={`px-2.5 py-1 rounded-md border ${setupComplete ? "border-accent2/30 text-accent2 bg-accent2/10" : "border-accent/30 text-accent bg-accent/10"}`}>
          {setupComplete ? "Workspace ready" : "Generating workspace"}
        </span>
      </div>
    </div>
  );
}

function DashboardView({
  agentState,
  company,
  role,
  timelineDays,
  setupComplete,
  setupError,
  workflowRunning,
  completedNodes,
  activeNode,
  roadmapProgress,
  setActiveTab,
  onRestart,
}: {
  agentState: AgentState;
  company: string;
  role: string;
  timelineDays: number;
  setupComplete: boolean;
  setupError: string | null;
  workflowRunning: boolean;
  completedNodes: string[];
  activeNode: string;
  roadmapProgress: number;
  setActiveTab: (tab: Tab) => void;
  onRestart?: (newCompany: string) => void;
}) {
  const companies_col1 = ["Amazon", "Microsoft", "Google", "Adobe", "Goldman Sachs", "Deloitte", "Infosys"];
  const companies_col2 = ["TCS NQT", "TCS Digital", "Accenture", "Cognizant GenC", "Wipro", "Capgemini", "Zoho"];
  
  const tech_topics = ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"];
  const interview_resources = ["Resume Builder", "HR Questions", "Behavioral Prep", "Interview Tips", "Communication Skills"];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="ambient-bg pointer-events-none">
        <div className="ambient-orb ambient-orb-1 opacity-10"></div>
        <div className="ambient-orb ambient-orb-2 opacity-10"></div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-10 relative z-10"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a5a0c4] tracking-tight">
            Placement Preparation Hub
          </h1>
          <p className="text-sm text-[#8e89b2] mt-2 font-medium">
            Browse structured learning paths, mock interview tracks, and coding assessments.
          </p>
        </motion.div>

        {setupError && (
          <motion.div variants={itemVariants} className="border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 rounded-xl p-4 text-sm text-[#ff6b6b] flex gap-3 shadow-[0_0_15px_rgba(255,107,107,0.1)]">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{setupError}</span>
          </motion.div>
        )}

        {/* CONTAINER 1: Company Specific vs Coding Assessments */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
            {/* Column 1: Company Specific */}
            <div className="p-7 space-y-5 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-accent/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-accent/20">
                  Company Specific
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-2">
                  {companies_col1.map((c) => (
                    <button
                      key={c}
                      onClick={() => onRestart && onRestart(c)}
                      className="block text-sm text-[#a5a0c4] hover:text-white transition-all text-left font-medium hover:translate-x-1 hover:text-accent2 duration-200"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {companies_col2.map((c) => (
                    <button
                      key={c}
                      onClick={() => onRestart && onRestart(c)}
                      className="block text-sm text-[#a5a0c4] hover:text-white transition-all text-left font-medium hover:translate-x-1 hover:text-accent2 duration-200"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center text-xs">
                <span className="text-[#5c5875] font-mono">14 tracks available</span>
                <button onClick={() => setActiveTab("mock")} className="text-accent2 hover:text-[#7cf5ce] font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Column 2: Coding Assessments */}
            <div className="p-7 space-y-5 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-accent/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-accent/20">
                  Coding Assessments
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Data Structures & Algorithms", desc: "Arrays, Trees, Graphs, DP" },
                  { name: "Object Oriented Programming", desc: "Classes, Inheritance, Polymorphism" },
                  { name: "Database Systems & SQL", desc: "Queries, Joins, Indexing, Transaction" },
                  { name: "System Design Essentials", desc: "Scalability, Caching, Load Balancing" }
                ].map((track) => (
                  <button
                    key={track.name}
                    onClick={() => setActiveTab("roadmap")}
                    className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-accent/40 hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(124,106,255,0.1)] transition-all duration-300 group/btn"
                  >
                    <div className="text-sm font-semibold text-white group-hover/btn:text-accent transition-colors">{track.name}</div>
                    <div className="text-[11px] text-[#7c7899] mt-1 font-mono tracking-tight">{track.desc}</div>
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center text-xs">
                <span className="text-[#5c5875] font-mono">4 core test domains</span>
                <button onClick={() => setActiveTab("roadmap")} className="text-accent2 hover:text-[#7cf5ce] font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CONTAINER 2: Mock Interviews vs AI Feedback Reports */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
            {/* Column 1: Mock Interviews */}
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-accent2/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-accent2/20">
                  Active Prep Session
                </span>
              </div>
              <div className="bg-gradient-to-b from-white/[0.03] to-transparent rounded-xl p-5 border border-white/[0.05] space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1">Target Domain</div>
                  <div className="text-lg font-bold text-white">{company} <span className="text-[#5c5875] mx-2">·</span> {role}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-black/20 rounded-lg p-3 border border-white/[0.02]">
                  <div>
                    <span className="text-[#7c7899] block mb-1">Timeline</span> <span className="text-white font-bold">{timelineDays} days</span>
                  </div>
                  <div>
                    <span className="text-[#7c7899] block mb-1">Progress</span> <span className="text-accent2 font-bold">{roadmapProgress}%</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("mock")}
                  className="w-full bg-gradient-to-r from-accent to-[#9f8fff] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(124,106,255,0.3)] flex items-center justify-center gap-2"
                >
                  Resume Active Mock Interview <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>

            {/* Column 2: AI Feedback Reports */}
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-accent/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-accent/20">
                  AI Performance Logs
                </span>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-[#a5a0c4] leading-relaxed">
                  View graded responses, actionable recommendations, and performance metrics calculated across your mock sessions.
                </p>
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Latest Readiness Index</div>
                    <div className="text-[10px] text-[#7c7899] mt-1 font-mono uppercase tracking-widest">Updated via LLM</div>
                  </div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-accent2 to-[#34b48f] font-mono">
                    {agentState.readinessScore == null ? "--" : `${Math.round(agentState.readinessScore)}%`}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("mock")}
                  className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] font-semibold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  Browse Graded History Reports
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CONTAINER 3: Technical Topics vs Interview Resources */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
            {/* Column 1: Learning Resources - Tech */}
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-[#ff6b6b]/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#ff6b6b]/20">
                  Technical Topics
                </span>
              </div>
              <div className="space-y-2">
                {tech_topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => onRestart && onRestart(t)}
                    className="flex items-center gap-3 w-full text-sm text-[#a5a0c4] hover:text-white transition-all text-left font-medium hover:translate-x-1 duration-200 group/btn"
                  >
                    <span className="text-[#ff6b6b]/60 group-hover/btn:text-[#ff6b6b] transition-colors">📁</span> {t}
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center text-xs">
                <span className="text-[#5c5875] font-mono">Concepts and practice sheets</span>
                <button onClick={() => setActiveTab("roadmap")} className="text-accent2 hover:text-[#7cf5ce] font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Column 2: Learning Resources - Interview Prep */}
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="bg-gradient-to-r from-accent3/20 to-transparent text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-accent3/20">
                  Interview Resources
                </span>
              </div>
              <div className="space-y-2">
                {interview_resources.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRestart && onRestart(r)}
                    className="flex items-center gap-3 w-full text-sm text-[#a5a0c4] hover:text-white transition-all text-left font-medium hover:translate-x-1 duration-200 group/btn"
                  >
                    <span className="text-accent3/60 group-hover/btn:text-accent3 transition-colors">📄</span> {r}
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center text-xs">
                <span className="text-[#5c5875] font-mono">Expert tips & STAR builders</span>
                <button onClick={() => setActiveTab("roadmap")} className="text-accent2 hover:text-[#7cf5ce] font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}


function RoadmapView({
  studyPlan,
  completedRoadmapTasks,
  setCompletedRoadmapTasks,
  workflowRunning,
}: {
  studyPlan: any;
  completedRoadmapTasks: Record<string, boolean>;
  setCompletedRoadmapTasks: (next: any) => void;
  workflowRunning: boolean;
}) {
  const phases = studyPlan?.phases || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="ambient-bg pointer-events-none">
        <div className="ambient-orb ambient-orb-1 opacity-10"></div>
        <div className="ambient-orb ambient-orb-2 opacity-10"></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8 relative z-10">
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a5a0c4] tracking-tight">
            Preparation Roadmap
          </h1>
          <p className="text-sm text-[#8e89b2] mt-2 font-medium">
            Track your generated preparation plan. Mark tasks complete as you work through them to level up your readiness.
          </p>
        </motion.div>

        {phases.length ? (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phases.map((phase: any, phaseIndex: number) => {
                const tasks = phase.tasks || [];
                const completed = tasks.filter((_: any, taskIndex: number) => completedRoadmapTasks[`${phaseIndex}-${taskIndex}`]).length;
                const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

                return (
                  <motion.div 
                    key={`${phase.name}-${phaseIndex}`} 
                    whileHover={{ scale: 1.01 }}
                    className="glass-card rounded-2xl p-6 space-y-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md inline-block shadow-[0_0_10px_rgba(124,106,255,0.15)] mb-2">Phase {phaseIndex + 1}</div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{phase.name}</h3>
                      </div>
                      <span className="text-xs font-bold font-mono bg-white/[0.05] border border-white/[0.1] text-accent2 px-3 py-1.5 rounded-lg shadow-inner">
                        {phase.days} days
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-semibold text-white">Progress</span>
                        <span className="text-xs font-mono text-accent2 font-bold">{progress}% ({completed}/{tasks.length})</span>
                      </div>
                      <div className="h-2 bg-[#111019] rounded-full overflow-hidden border border-[#2d2c41] shadow-inner">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-accent to-accent2" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {tasks.map((task: string, taskIndex: number) => {
                        const taskId = `${phaseIndex}-${taskIndex}`;
                        const checked = !!completedRoadmapTasks[taskId];
                        return (
                          <motion.button
                            key={taskId}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setCompletedRoadmapTasks((prev: Record<string, boolean>) => ({
                                ...prev,
                                [taskId]: !checked,
                              }))
                            }
                            className="w-full flex items-start gap-3 text-sm text-[#d7d3ef] text-left group/task hover:bg-white/[0.03] p-2 -ml-2 rounded-lg transition-colors"
                          >
                            <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${checked ? "bg-accent text-bg0 border-accent shadow-[0_0_10px_rgba(79,217,179,0.3)]" : "border-white/[0.2] group-hover/task:border-accent/50 text-transparent"}`}>
                              {checked && <Check size={14} strokeWidth={3} />}
                            </span>
                            <span className="leading-snug">{String(task)}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {(Array.isArray(studyPlan?.resources) ? studyPlan.resources : typeof studyPlan?.resources === 'string' ? [studyPlan.resources] : [])?.length > 0 && (
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border-t-[3px] border-t-accent3">
                <h3 className="text-lg font-bold text-white tracking-tight">Recommended Resources</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(Array.isArray(studyPlan?.resources) ? studyPlan.resources : typeof studyPlan?.resources === 'string' ? [studyPlan.resources] : []).map((resource: any, index: number) => (
                    <span key={`${resource}-${index}`} className="text-xs bg-white/[0.05] border border-white/[0.1] text-[#d7d3ef] font-medium px-3 py-1.5 rounded-lg hover:bg-white/[0.1] transition-colors cursor-default">
                      {String(resource)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div variants={itemVariants} className="h-64 flex items-center justify-center">
            {workflowRunning ? (
              <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-md w-full">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40 shadow-[0_0_20px_rgba(124,106,255,0.3)]">
                  <Loader2 size={30} className="text-accent animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Generating Roadmap</h2>
                <p className="text-sm text-[#a5a0c4] leading-relaxed">
                  Crafting your personalized 30-day prep guide based on your domain and weaknesses.
                </p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-md w-full opacity-60">
                <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                  <ClipboardList size={30} className="text-[#a5a0c4]" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Roadmap Pending</h2>
                <p className="text-sm text-[#a5a0c4] leading-relaxed">
                  Start your setup workflow to generate a personalized learning path.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function MockInterviewView({
  questions,
  currentIndex,
  currentQuestion,
  mockAnswer,
  setMockAnswer,
  mockFeedback,
  evaluatingMock,
  showMockHint,
  setShowMockHint,
  selectMockQuestion,
  submitMockAnswer,
  nextMockQuestion,
  workflowRunning,
}: {
  questions: any[];
  currentIndex: number;
  currentQuestion: any;
  mockAnswer: string;
  setMockAnswer: (value: string) => void;
  mockFeedback: any | null;
  evaluatingMock: boolean;
  showMockHint: boolean;
  setShowMockHint: (value: boolean) => void;
  selectMockQuestion: (index: number) => void;
  submitMockAnswer: () => void;
  nextMockQuestion: () => void;
  workflowRunning: boolean;
}) {
  const [isListening, setIsListening] = useState(false);

  function handleVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMockAnswer(mockAnswer ? mockAnswer + " " + transcript : transcript);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  if (!questions.length) {
    return (
      <div className="flex-1 overflow-y-auto p-8 relative flex items-center justify-center">
        <div className="ambient-bg pointer-events-none">
          <div className="ambient-orb ambient-orb-1 opacity-10"></div>
          <div className="ambient-orb ambient-orb-2 opacity-10"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-md"
        >
          {workflowRunning ? (
            <>
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40 shadow-[0_0_20px_rgba(124,106,255,0.3)]">
                <Loader2 size={30} className="text-accent animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Generating Mock Questions</h2>
              <p className="text-sm text-[#a5a0c4] leading-relaxed">
                Analyzing your weaknesses and target company patterns to curate the perfect question bank.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                <Target size={30} className="text-[#a5a0c4]" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Mock Interview Pending</h2>
              <p className="text-sm text-[#a5a0c4] leading-relaxed">
                Start your setup workflow to generate personalized interview questions.
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex relative">
      <div className="ambient-bg pointer-events-none">
        <div className="ambient-orb ambient-orb-1 opacity-[0.05]"></div>
        <div className="ambient-orb ambient-orb-3 opacity-[0.05]"></div>
      </div>
      
      {/* Sidebar List */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[340px] border-r border-white/[0.05] bg-[#0a0910]/60 backdrop-blur-md flex flex-col overflow-hidden relative z-10"
      >
        <div className="p-6 border-b border-white/[0.05]">
          <h2 className="text-lg font-bold text-white tracking-tight">Mock Interview</h2>
          <p className="text-xs text-[#8e89b2] mt-1.5 leading-relaxed">Question bank generated from weak areas and company patterns.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(Array.isArray(questions) ? questions : typeof questions === 'string' ? [{ id: "1", question: questions }] : []).map((question: any, index: number) => {
            const active = index === currentIndex;
            return (
              <motion.button
                key={`${question?.id || question?.question}-${index}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectMockQuestion(index)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  active 
                    ? "bg-accent/10 border-accent/40 shadow-[0_0_15px_rgba(124,106,255,0.15)]" 
                    : "bg-white/[0.02] border-white/[0.05] hover:border-accent/30 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded-md ${active ? "bg-accent text-white" : "bg-white/[0.05] text-[#a5a0c4]"}`}>
                    Q{index + 1}
                  </span>
                  <span className="text-[10px] font-mono text-[#8e89b2] border border-white/[0.1] px-1.5 py-0.5 rounded">{question?.difficulty || "Unrated"}</span>
                </div>
                <p className={`text-sm line-clamp-2 ${active ? "text-white font-medium" : "text-[#d7d3ef]"}`}>{question?.question}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {currentQuestion ? (
          <>
            <motion.div 
              key={`header-${currentIndex}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 border-b border-white/[0.05] bg-[#0a0910]/40 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold font-mono text-accent2 uppercase tracking-widest bg-accent2/10 border border-accent2/20 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(79,217,179,0.1)]">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[11px] font-semibold bg-white/[0.05] border border-white/[0.1] text-[#a5a0c4] px-2.5 py-1 rounded-md">
                  {currentQuestion.type || "General"}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white leading-relaxed tracking-tight">{currentQuestion.question}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {(currentQuestion.expected_topics || []).map((topic: string, index: number) => (
                  <span key={`${topic}-${index}`} className="text-xs bg-white/[0.05] border border-white/[0.1] text-[#c5c0e6] px-3 py-1.5 rounded-lg shadow-inner">
                    {topic}
                  </span>
                ))}
              </div>
              {currentQuestion.hint && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowMockHint(!showMockHint)}
                    className="text-xs font-bold font-mono text-accent2 hover:text-[#7cf5ce] transition-colors flex items-center gap-1.5"
                  >
                    {showMockHint ? "Hide hint" : "Reveal hint"} <ChevronRight size={14} className={`transform transition-transform ${showMockHint ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showMockHint && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm text-[#d7d3ef] bg-accent/5 border border-accent/20 rounded-xl p-4 shadow-inner">
                          {currentQuestion.hint}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            <div className="flex-1 overflow-y-auto p-8">
              {!mockFeedback ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="h-full flex flex-col gap-4 max-w-4xl mx-auto"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold font-mono text-[#8e89b2] uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7c6aff]"></span> Draft your answer
                    </label>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoiceInput}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        isListening
                          ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/40 shadow-[0_0_15px_rgba(255,107,107,0.3)]"
                          : "bg-white/[0.05] text-[#a5a0c4] border border-white/[0.1] hover:border-accent/40 hover:text-white"
                      }`}
                    >
                      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      {isListening ? "Listening..." : "Voice Input"}
                    </motion.button>
                  </div>
                  {currentQuestion.type === "DSA" ? (
                    <div className="flex-1 min-h-[320px] border border-white/[0.1] rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      <Editor
                        height="100%"
                        defaultLanguage="cpp"
                        theme="vs-dark"
                        value={mockAnswer}
                        onChange={(val) => setMockAnswer(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          fontFamily: "'JetBrains Mono', monospace",
                          automaticLayout: true,
                          scrollbar: { vertical: "visible", horizontal: "visible" },
                          padding: { top: 16 }
                        }}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={mockAnswer}
                      onChange={(event) => setMockAnswer(event.target.value)}
                      placeholder="Write your structured answer, approach, tradeoffs, and complexity here..."
                      className="flex-1 min-h-[260px] glass-card border border-white/[0.1] rounded-2xl p-5 text-sm text-white placeholder-[#706b8f] focus:border-accent/50 focus:shadow-[0_0_20px_rgba(124,106,255,0.15)] outline-none resize-none leading-relaxed transition-all font-mono"
                    />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitMockAnswer}
                    disabled={evaluatingMock || !mockAnswer.trim()}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-[#9f8fff] hover:shadow-[0_0_20px_rgba(124,106,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none text-white font-bold px-5 py-3.5 rounded-xl text-sm transition-all"
                  >
                    {evaluatingMock ? <Loader2 size={18} className="animate-spin" /> : <BookOpenCheck size={18} />}
                    {evaluatingMock ? "Evaluating answer..." : "Submit for evaluation"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-4xl mx-auto">
                  <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StatCard
                      label="Score Change"
                      value={mockFeedback.score_delta >= 0 ? `+${mockFeedback.score_delta}` : mockFeedback.score_delta}
                      icon={TrendingUp}
                    />
                    <StatCard label="Grade" value={mockFeedback.score_label || "Evaluated"} icon={BookOpenCheck} />
                  </motion.div>
                  <motion.div variants={itemVariants} className="glass-card border border-white/[0.05] rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent2"></div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-accent2/20 flex items-center justify-center text-accent2"><Check size={14} /></span>
                      AI Feedback Analysis
                    </h3>
                    <p className="text-sm text-[#d7d3ef] leading-relaxed pl-8">{mockFeedback.feedback}</p>
                  </motion.div>
                  <motion.div variants={itemVariants}><FeedbackList title="Strengths" items={mockFeedback.strengths || []} tone="good" /></motion.div>
                  <motion.div variants={itemVariants}><FeedbackList title="Improvements" items={mockFeedback.improvements || []} tone="warn" /></motion.div>
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextMockQuestion}
                    disabled={currentIndex >= questions.length - 1}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.1] hover:border-accent/40 hover:bg-accent/10 disabled:opacity-40 text-white font-bold px-5 py-3.5 rounded-xl text-sm transition-all shadow-inner"
                  >
                    Proceed to Next Question
                    <ChevronRight size={18} />
                  </motion.button>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8e89b2] text-sm">
            <div className="glass-card p-6 rounded-2xl border border-dashed border-[#2d2c41]">
              Select a question from the sidebar to begin.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsView({
  agentState,
  roadmapProgress,
  questionStats,
  workflowRunning,
  sessionHistory,
}: {
  agentState: AgentState;
  roadmapProgress: number;
  questionStats: Record<string, number>;
  workflowRunning: boolean;
  sessionHistory: any[];
}) {
  const typeStats = Object.entries(questionStats).filter(([key]) => key.startsWith("type:"));

  // Format history for Line Chart
  const historyData = sessionHistory.map(s => ({
    date: s.created_at ? format(parseISO(s.created_at), "MMM dd HH:mm") : "Unknown",
    score: s.readiness_score || 0,
    company: s.company,
  }));

  // Format typeStats for Radar Chart
  const radarData = typeStats.map(([key, val]) => ({
    subject: key.replace("type:", ""),
    count: val,
    fullMark: Math.max(...typeStats.map(([, v]) => v)) || 10,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  if (workflowRunning && !agentState.weakAreas) {
    return (
      <div className="flex-1 overflow-y-auto p-8 relative flex items-center justify-center">
        <div className="ambient-bg pointer-events-none">
          <div className="ambient-orb ambient-orb-1 opacity-10"></div>
          <div className="ambient-orb ambient-orb-3 opacity-10"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40 shadow-[0_0_20px_rgba(124,106,255,0.3)]">
            <Loader2 size={30} className="text-accent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Building Analytics</h2>
          <p className="text-sm text-[#a5a0c4] leading-relaxed">
            Please wait while we compute your weak-area analysis, resume signals, and readiness metrics from your session.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="ambient-bg pointer-events-none">
        <div className="ambient-orb ambient-orb-2 opacity-10"></div>
        <div className="ambient-orb ambient-orb-3 opacity-10"></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a5a0c4] tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[#8e89b2] mt-2 font-medium">
            Track your readiness scores, mock interview performance by domain, and study plan calendar.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent2/20 flex items-center justify-center border border-accent2/30 shadow-[0_0_15px_rgba(79,217,179,0.2)]">
              <TrendingUp className="text-accent2" size={24} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-1">Current Readiness</div>
              <div className="text-3xl font-black text-white">{agentState.readinessScore == null ? "--" : `${Math.round(agentState.readinessScore)}%`}</div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ff6b6b]/20 flex items-center justify-center border border-[#ff6b6b]/30 shadow-[0_0_15px_rgba(255,107,107,0.2)]">
              <ClipboardList className="text-[#ff6b6b]" size={24} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-1">Roadmap Progress</div>
              <div className="text-3xl font-black text-white">{roadmapProgress}%</div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(124,106,255,0.2)]">
              <BarChart3 className="text-accent" size={24} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-1">Total History Sessions</div>
              <div className="text-3xl font-black text-white">{sessionHistory.length}</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Readiness Score Trend</h3>
            <div className="h-72">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c6aff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c6aff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2c41" vertical={false} />
                    <XAxis dataKey="date" stroke="#8e89b2" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8e89b2" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(17,16,25,0.9)', backdropFilter: 'blur(10px)', borderColor: '#2d2c41', color: '#fff', fontSize: '13px', borderRadius: '12px', padding: '12px' }}
                      itemStyle={{ color: '#7c6aff', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#7c6aff" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8e89b2] text-sm bg-white/[0.02] rounded-xl border border-dashed border-[#2d2c41]">No historical data available.</div>
              )}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Mock Question Domains</h3>
            <div className="h-72">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#2d2c41" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a5a0c4', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, radarData[0]?.fullMark || 10]} tick={false} axisLine={false} />
                    <Radar name="Questions" dataKey="count" stroke="#4fd9b3" strokeWidth={2} fill="#4fd9b3" fillOpacity={0.3} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(17,16,25,0.9)', backdropFilter: 'blur(10px)', borderColor: '#2d2c41', color: '#fff', fontSize: '13px', borderRadius: '12px', padding: '12px' }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8e89b2] text-sm bg-white/[0.02] rounded-xl border border-dashed border-[#2d2c41]">No mock questions yet.</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Study Plan Calendar View */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Study Plan Timeline</h3>
          <div className="relative border-l-[3px] border-accent2/30 ml-4 space-y-10">
            {(agentState.studyPlan?.phases || []).map((phase: any, idx: number) => (
              <motion.div 
                key={idx} 
                className="relative pl-8"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <span className="absolute -left-[11px] top-1.5 w-[19px] h-[19px] rounded-full bg-[#111019] border-[4px] border-accent2 shadow-[0_0_12px_rgba(46,213,115,0.6)]" />
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold font-mono bg-accent/20 border border-accent/40 text-accent px-2.5 py-1 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(124,106,255,0.15)]">
                    Phase {idx + 1}
                  </span>
                  <span className="text-xs text-[#a5a0c4] font-semibold bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/[0.05]">{phase.days} Days</span>
                </div>
                <h4 className="text-lg font-bold text-white mt-3 tracking-tight">{phase.name}</h4>
                <div className="text-sm text-[#d7d3ef] mt-3 space-y-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                  {phase.tasks?.slice(0, 3).map((task: string, tIdx: number) => (
                    <div key={tIdx} className="flex gap-3 items-start"><span className="text-accent2 mt-0.5">•</span><span className="leading-relaxed">{task}</span></div>
                  ))}
                  {phase.tasks?.length > 3 && (
                    <div className="text-xs text-[#8e89b2] italic pl-5 pt-1 font-medium">+{phase.tasks.length - 3} more tasks</div>
                  )}
                </div>
              </motion.div>
            ))}
            {(!agentState.studyPlan?.phases || agentState.studyPlan.phases.length === 0) && (
              <div className="text-sm text-[#8e89b2] pl-8 bg-white/[0.02] rounded-xl border border-dashed border-[#2d2c41] p-6 text-center">Study plan is empty. Generate a roadmap first.</div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

function ChatView({
  messages,
  input,
  setInput,
  sendMessage,
  chatLoading,
  setupComplete,
  messagesEndRef,
}: {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  chatLoading: boolean;
  setupComplete: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <div className="ambient-bg pointer-events-none">
        <div className="ambient-orb ambient-orb-1 opacity-[0.05]"></div>
        <div className="ambient-orb ambient-orb-3 opacity-[0.05]"></div>
      </div>

      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-white/[0.05] bg-[#0a0910]/60 backdrop-blur-md px-8 py-5 relative z-10"
      >
        <div className="flex items-center gap-3 text-lg font-bold text-white tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-accent2/20 flex items-center justify-center border border-accent2/40 shadow-[0_0_10px_rgba(79,217,179,0.2)]">
            <MessageSquareText size={16} className="text-accent2" />
          </span>
          Mentor Chat
        </div>
        <p className="text-sm text-[#8e89b2] mt-2.5 leading-relaxed max-w-3xl">
          Ask doubts, request explanations, discuss answers, and get preparation guidance. Generated artifacts stay in the dashboard sections.
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-8 space-y-5 relative z-10">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-t border-white/[0.05] bg-[#0a0910]/80 backdrop-blur-md relative z-10"
      >
        <div className="flex gap-4 max-w-5xl mx-auto items-end">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            disabled={!setupComplete}
            placeholder={setupComplete ? "Ask a doubt or request interview guidance..." : "Mentor chat unlocks after dashboard generation finishes."}
            rows={1}
            className="flex-1 bg-white/[0.02] border border-white/[0.1] rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:border-accent/50 focus:shadow-[0_0_20px_rgba(124,106,255,0.15)] resize-none placeholder-[#706b8f] disabled:opacity-40 transition-all font-medium"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={sendMessage}
            disabled={chatLoading || !setupComplete || !input.trim()}
            className="inline-flex items-center justify-center gap-2 h-[46px] bg-gradient-to-r from-accent to-[#9f8fff] hover:shadow-[0_0_15px_rgba(124,106,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none text-white font-bold rounded-xl px-6 text-sm transition-all"
          >
            {chatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Send
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-bg1 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#8e89b2] uppercase tracking-wider">{label}</span>
        <Icon size={17} className="text-accent2" />
      </div>
      <div className="text-2xl font-bold text-white mt-3">{value}</div>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  icon: Icon,
  ready,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  ready: boolean;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-bg1 border border-border rounded-lg p-5 flex flex-col min-h-[190px]">
      <div className="flex items-center justify-between">
        <Icon size={22} className="text-accent2" />
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${ready ? "border-accent2/30 text-accent2 bg-accent2/10" : "border-border text-[#706b8f] bg-bg2"}`}>
          {ready ? "Stored" : "Pending"}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mt-4">{title}</h3>
      <p className="text-sm text-[#a5a0c4] mt-2 leading-relaxed flex-1">{description}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center justify-center gap-2 bg-bg2 border border-border hover:border-accent/40 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all mt-4"
      >
        {buttonLabel}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-sm text-[#a5a0c4] mt-2">{description}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-bg1 border border-border rounded-lg p-10 text-center text-[#8e89b2]">
      <Icon size={34} className="text-accent2 mx-auto mb-4" />
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm mt-2">{description}</p>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono text-[#8e89b2] mb-1.5">
        <span>Progress</span>
        <span>{label}</span>
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
        <div className="h-full bg-accent2 rounded-full transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: any; tone: "good" | "warn" }) {
  const color = tone === "good" ? "text-accent2 border-accent2/20 bg-accent2/10" : "text-accent3 border-accent3/20 bg-accent3/10";
  const safeItems = Array.isArray(items) ? items : typeof items === 'string' ? [items] : [];
  
  return (
    <div className={`border rounded-lg p-5 ${color}`}>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {safeItems.length ? (
        <ul className="space-y-2">
          {safeItems.map((item: any, index: number) => (
            <li key={`${item}-${index}`} className="text-sm text-[#d7d3ef] flex gap-2">
              <span>-</span>
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#8e89b2]">No entries returned.</p>
      )}
    </div>
  );
}

function AnalysisBlock({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "border-accent2/20 text-accent2"
      : tone === "warn"
      ? "border-accent3/20 text-accent3"
      : "border-border text-[#c5c0e6]";

  return (
    <div className="bg-bg1 border border-border rounded-lg p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {items.length ? (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className={`text-xs bg-bg2 border px-3 py-1.5 rounded-md ${toneClass}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#8e89b2] mt-3">{empty}</p>
      )}
    </div>
  );
}

function DistributionBlock({ title, entries, prefix }: { title: string; entries: [string, number][]; prefix: string }) {
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="bg-bg1 border border-border rounded-lg p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {entries.length ? (
        <div className="space-y-3 mt-4">
          {entries.map(([key, value]) => {
            const label = key.replace(prefix, "");
            const percent = total ? Math.round((value / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs text-[#c5c0e6] mb-1.5">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#8e89b2] mt-3">No question distribution available yet.</p>
      )}
    </div>
  );
}

function replaceLastAssistant(messages: Message[], content: string): Message[] {
  const next = [...messages];
  for (let index = next.length - 1; index >= 0; index--) {
    if (next[index].role === "assistant") {
      next[index] = { role: "assistant", content };
      return next;
    }
  }
  return [...next, { role: "assistant", content }];
}

function toStringList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      return JSON.stringify(item);
    });
  }
  if (typeof value === "string") return [value];
  return [JSON.stringify(value)];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
