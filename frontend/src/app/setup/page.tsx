"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Upload, Calendar, Search, Building2, Server, Globe2, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadResume, streamChat, api } from "@/lib/api";
import { setActiveSessionId, getAuthToken } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";

export default function SetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompany = searchParams.get("company");
  const initialRole = searchParams.get("role");
  const autoStart = searchParams.get("auto");

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
    }
  }, [router]);

  const [step, setStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(initialCompany);
  const [role, setRole] = useState(initialRole || "SDE-1 / Entry Level");
  
  const [resumeText, setResumeText] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [timelineDays, setTimelineDays] = useState(14);
  const [dailyHours, setDailyHours] = useState("3h");
  const [interviewerPersona, setInterviewerPersona] = useState("Standard Recruiter");

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState<any>({
    resume: false, research: false, gap: false, plan: false, mock: false
  });
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await uploadResume(file);
      setResumeText(data.resume_text);
      setResumeAnalysis(data.analysis);
      setStep(3);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const runPipeline = async () => {
    if (!selectedCompany) {
      alert("Please select a company");
      setStep(1);
      return;
    }
    setStep(4);
    setIsStreaming(true);
    
    try {
      // 1. Create Session
      const sessionRes = await api.post("/chat/session", {
        company: selectedCompany,
        role: role,
        timeline_days: timelineDays,
        resume_text: resumeText,
        interviewer_persona: interviewerPersona
      });
      const sessionId = sessionRes.data.session_id;
      setActiveSessionId(sessionId);

      // 2. Stream Pipeline
      await streamChat({
        session_id: sessionId,
        company: selectedCompany,
        role: role,
        timeline_days: timelineDays,
        resume_text: resumeText,
        message: "Start Setup",
        workflow_only: true
      }, (chunk) => {
        if (chunk.step === "resume_analysis") setStreamProgress((p: any) => ({ ...p, resume: true }));
        if (chunk.step === "company_research") setStreamProgress((p: any) => ({ ...p, resume: true, research: true }));
        if (chunk.step === "gap_analysis") setStreamProgress((p: any) => ({ ...p, resume: true, research: true, gap: true }));
        if (chunk.step === "plan_generation") setStreamProgress((p: any) => ({ ...p, resume: true, research: true, gap: true, plan: true }));
        if (chunk.step === "mock_generation") setStreamProgress((p: any) => ({ ...p, resume: true, research: true, gap: true, plan: true, mock: true }));
        if (chunk.weak_areas) {
          setFinalAnalysis(chunk);
          setIsStreaming(false);
        }
      });
    } catch (err: any) {
      alert("Pipeline failed: " + err.message);
      setIsStreaming(false);
    }
  };

  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (autoStart === "true" && selectedCompany && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      runPipeline();
    }
  }, [autoStart, selectedCompany]);

  const renderStepper = () => (
    <div className="flex items-center justify-center max-w-2xl mx-auto w-full mb-12 relative">
      <div className="absolute top-4 left-[12.5%] right-[12.5%] h-[2px] bg-[#2d2c41] -z-10" />
      {[
        { id: 1, label: "Company" },
        { id: 2, label: "Resume" },
        { id: 3, label: "Timeline" },
        { id: 4, label: "Agents" },
      ].map((s, idx) => {
        const isCompleted = step > s.id;
        const isActive = step === s.id;
        return (
          <div key={s.id} className={`flex flex-col items-center flex-1 ${isActive || isCompleted ? "opacity-100" : "opacity-50"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors ${
              isCompleted 
                ? "bg-accent text-[#060609]" 
                : isActive 
                  ? "bg-[#0a0a0f] border-2 border-accent text-accent" 
                  : "bg-[#2d2c41] text-[#a5a0c4]"
            }`}>
              {isCompleted ? <Check size={16} strokeWidth={3} /> : s.id}
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-widest mt-2 ${isActive || isCompleted ? "text-white" : "text-[#5c5875]"}`}>
              {s.label}
            </span>
            {idx < 3 && (isActive || isCompleted) && (
              <div 
                className="absolute top-4 h-[2px] bg-accent transition-all duration-500 ease-out z-[-5] shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                style={{ 
                  left: `${(idx * 25) + 12.5}%`, 
                  width: isCompleted ? "25%" : "0%"
                }} 
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-3xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Target Company</h2>
        <p className="text-[#a5a0c4] text-sm">Choose the company you're preparing for. Our RAG corpus has recency-weighted interview experiences for each.</p>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">Curated Interview Packs</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { name: "Google", sector: "Tech", diff: "Very Hard", diffColor: "text-[#ff4757] border-[#ff4757]/30 bg-[#ff4757]/10", tags: ["Algorithms", "System Design", "Coding"], curated: true },
          { name: "Amazon", sector: "Tech / E-commerce", diff: "Hard", diffColor: "text-[#ff6b6b] border-[#ff6b6b]/30 bg-[#ff6b6b]/10", tags: ["LP Questions", "DSA", "System Design"], curated: true },
          { name: "Microsoft", sector: "Tech", diff: "Medium-Hard", diffColor: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10", tags: ["DSA", "OOP", "Behavioural"], curated: true },
          { name: "Meta", sector: "Tech", diff: "Very Hard", diffColor: "text-[#ff4757] border-[#ff4757]/30 bg-[#ff4757]/10", tags: ["System Design", "Product Architecture", "DSA"], curated: true },
        ].map((c) => (
          <div 
            key={c.name} 
            onClick={() => { setSelectedCompany(c.name); setRole("SDE-2 / Mid Level"); }}
            className={`glass-card p-5 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
              selectedCompany === c.name 
                ? "border-accent shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-accent/5" 
                : "border-[#2d2c41] bg-[#181724]/70 hover:border-white/20"
            }`}
          >
            <div className="absolute top-0 right-0 bg-accent text-[#060609] text-[9px] font-bold px-2 py-0.5 rounded-bl">CURATED</div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2d2c41]/50 flex items-center justify-center text-[#a5a0c4]">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="font-bold text-white">{c.name} Pack</div>
                  <div className="text-[10px] text-[#5c5875]">Curated question banks & templates</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-bold text-[#a5a0c4] uppercase tracking-wider mb-3">Other Target Companies</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { name: "Boeing", sector: "Aerospace & Defense", diff: "Hard", diffColor: "text-[#ff6b6b] border-[#ff6b6b]/30 bg-[#ff6b6b]/10", tags: ["OOP Design", "System Design", "DSA"] },
          { name: "Infosys", sector: "IT Services", diff: "Medium", diffColor: "text-accent2 border-accent2/30 bg-accent2/10", tags: ["Aptitude", "DBMS", "OS Basics"] },
          { name: "TCS", sector: "IT Services", diff: "Medium", diffColor: "text-accent2 border-accent2/30 bg-accent2/10", tags: ["Aptitude", "Coding", "DBMS"] },
        ].map((c) => (
          <div 
            key={c.name} 
            onClick={() => setSelectedCompany(c.name)}
            className={`glass-card p-5 rounded-xl cursor-pointer transition-all ${
              selectedCompany === c.name 
                ? "border-accent shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-accent/5" 
                : "border-[#2d2c41] bg-[#181724]/70 hover:border-white/20"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2d2c41]/50 flex items-center justify-center text-[#a5a0c4]">
                  {c.sector.includes("Aerospace") ? <Globe2 size={20} /> : <Server size={20} />}
                </div>
                <div>
                  <div className="font-bold text-white">{c.name}</div>
                  <div className="text-[10px] text-[#5c5875]">{c.sector}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-white mb-2">Target Role Level</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#12121a] border border-[#2d2c41] rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-accent">
          <option>SDE-1 / Entry Level</option>
          <option>SDE-2 / Mid Level</option>
          <option>Senior SDE</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => {
            if (!selectedCompany) alert("Please select a company");
            else setStep(2);
          }}
          className="bg-accent hover:bg-accent/90 text-[#060609] font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-3xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
        <p className="text-[#a5a0c4] text-sm">The Resume Parser Agent extracts skills, projects, and experience level to build your gap profile.</p>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleUpload} />

      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#2d2c41] hover:border-accent/50 rounded-2xl bg-[#12121a]/50 flex flex-col items-center justify-center py-16 mb-8 transition-colors cursor-pointer group"
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-accent mb-4" size={32} />
            <div className="font-bold text-white">Parsing Resume...</div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#2d2c41] group-hover:bg-accent/20 flex items-center justify-center text-[#a5a0c4] group-hover:text-accent transition-colors mb-4">
              <Upload size={24} />
            </div>
            <div className="font-bold text-white mb-1">
              {resumeAnalysis ? "Resume Uploaded. Click to change." : "Drop your resume PDF here"}
            </div>
            {resumeAnalysis && (
              <div className="text-sm text-accent mt-2">
                Parsed {resumeAnalysis.skills?.length || 0} skills.
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button 
          onClick={() => setStep(1)}
          className="flex items-center gap-2 bg-[#181724] hover:bg-[#2d2c41] border border-[#2d2c41] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button 
          onClick={() => setStep(3)}
          className="bg-accent hover:bg-accent/90 text-[#060609] font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2"
        >
          {resumeText ? "Continue" : "Skip"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-3xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Set Your Time Budget</h2>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-white mb-2">Days Until Interview</label>
        <div className="flex flex-wrap gap-3">
          {[7, 14, 21, 30].map(d => (
            <button 
              key={d}
              onClick={() => setTimelineDays(d)}
              className={`px-4 py-2 rounded-lg border flex items-center justify-center font-medium transition-colors ${
                timelineDays === d ? "border-accent bg-accent/10 text-accent" : "border-[#2d2c41] bg-[#12121a] text-[#a5a0c4]"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-white mb-2">Daily Study Hours</label>
        <div className="flex flex-wrap gap-3">
          {["1h", "2h", "3h", "4h", "5h", "6h"].map(h => (
            <button 
              key={h}
              onClick={() => setDailyHours(h)}
              className={`w-12 h-12 rounded-lg border flex items-center justify-center font-medium transition-colors ${
                dailyHours === h ? "border-accent bg-accent/10 text-accent" : "border-[#2d2c41] bg-[#12121a] text-[#a5a0c4]"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-white mb-2">Interviewer Persona</label>
        <p className="text-[#a5a0c4] text-xs mb-3">Select the behavior of the AI interviewer evaluating your responses.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: "Standard Recruiter", name: "Standard Recruiter", desc: "Focuses on STAR method and structured logic." },
            { id: "Encouraging Mentor", name: "Encouraging Mentor", desc: "Provides helpful hints and positive coaching." },
            { id: "Tough Tech Lead", name: "Tough Tech Lead", desc: "Very critical, direct feedback on trade-offs & edge cases." }
          ].map(p => (
            <button 
              key={p.id}
              type="button"
              onClick={() => setInterviewerPersona(p.id)}
              className={`p-4 rounded-xl border flex flex-col items-start text-left transition-all ${
                interviewerPersona === p.id ? "border-accent bg-accent/5 text-white" : "border-[#2d2c41] bg-[#12121a] text-[#a5a0c4]"
              }`}
            >
              <div className="font-bold text-sm mb-1">{p.name}</div>
              <div className="text-[10px] text-[#5c5875] leading-relaxed">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-[#181724] border border-[#2d2c41] text-white px-5 py-2.5 rounded-lg text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={runPipeline} className="bg-accent text-[#060609] font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2">
          Run Agent Pipeline <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Agent Pipeline</h2>
      </div>

      <div className="space-y-4 mb-8">
        {[
          { key: "resume", name: "Resume Parser Agent" },
          { key: "research", name: "Company Research Agent (RAG)" },
          { key: "gap", name: "Gap Analyzer Agent" },
          { key: "plan", name: "Study Plan Generator Agent" },
          { key: "mock", name: "Mock Interview Agent" },
        ].map(agent => {
          const isDone = streamProgress[agent.key] || finalAnalysis;
          return (
            <div key={agent.key} className={`glass-card rounded-xl border p-4 flex items-center justify-between transition-colors ${isDone ? 'border-[#4fd9b3]/30 bg-[#4fd9b3]/5' : 'border-[#2d2c41] bg-[#12121a]/80'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDone ? 'bg-[#4fd9b3]/20 text-[#4fd9b3]' : 'bg-[#2d2c41] text-[#5c5875]'}`}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : <Loader2 size={12} className={isStreaming ? "animate-spin" : ""} />}
                </div>
                <div className="font-bold text-white mb-0.5">{agent.name}</div>
              </div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isDone ? 'text-[#4fd9b3] border border-[#4fd9b3]/30 bg-[#4fd9b3]/10' : 'text-[#a5a0c4] border border-[#2d2c41] bg-[#181724]'}`}>
                {isDone ? 'Done' : 'Waiting'}
              </div>
            </div>
          )
        })}
      </div>

      {finalAnalysis && (
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white">Ranked Gap Analysis</h3>
            <span className="text-[10px] font-bold text-[#ff6b6b] border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 px-2 py-1 rounded flex items-center gap-1 uppercase">
              <AlertTriangle size={12} /> Critical Gaps Found
            </span>
          </div>
          <div className="glass-card rounded-xl border border-[#2d2c41] bg-[#12121a]/80 overflow-hidden">
            {finalAnalysis.weak_areas?.map((wa: any, i: number) => {
              const topic = typeof wa === 'string' ? wa : wa.topic || 'Unknown Topic';
              const reasoning = typeof wa === 'string' ? 'Identified as a critical gap based on resume analysis.' : wa.reasoning || '';
              return (
                <div key={i} className="p-4 border-b border-[#2d2c41] flex gap-4">
                  <div className="text-white font-medium w-6">{i+1}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{topic}</span>
                      <span className="text-[10px] font-bold text-bg0 bg-[#ff6b6b] px-2 py-0.5 rounded-full">Critical</span>
                    </div>
                    <div className="text-xs text-[#a5a0c4]">{reasoning}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-12 gap-4">
            <Link href="/dashboard" className="flex-1 text-center bg-[#181724] hover:bg-[#2d2c41] border border-[#2d2c41] text-white font-medium px-6 py-3 rounded-lg text-sm transition-all">
              Go to Dashboard <span className="ml-2 text-accent">→</span>
            </Link>
            <Link href="/interview" className="flex-1 text-center bg-accent hover:bg-accent/90 text-[#060609] font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              Start First Mock
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">New Prep Session</h1>
          <div className="text-xs text-[#5c5875]">Step {step} of 4 · {step === 1 ? 'Target Company' : step === 2 ? 'Resume Upload' : step === 3 ? 'Time Budget' : 'Agent Analysis'}</div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        {renderStepper()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
}
