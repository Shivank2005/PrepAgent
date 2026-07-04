"use client";
import { useState, useRef } from "react";
import { uploadResume } from "@/lib/api";
import { motion } from "framer-motion";

interface Props {
  onStart: (s: { sessionId: string; company: string; role: string; timelineDays: number; resumeText?: string }) => void;
}

const COMPANIES = ["Boeing", "Google", "Amazon", "Microsoft", "Apple", "Meta", "Uber", "Flipkart", "Infosys", "TCS", "Other"];

export default function SetupForm({ onStart }: Props) {
  const [company, setCompany] = useState("Boeing");
  const [customCompany, setCustomCompany] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [timeline, setTimeline] = useState(14);
  const [resumeText, setResumeText] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const data = await uploadResume(f);
      setResumeText(data.resume_text);
    } catch {
      alert("Failed to upload resume. Continuing without it.");
    }
    setUploading(false);
  }

  function handleStart() {
    const finalCompany = company === "Other" ? customCompany : company;
    if (!finalCompany.trim()) return;
    onStart({
      sessionId: createSessionId(),
      company: finalCompany,
      role,
      timelineDays: timeline,
      resumeText,
    });
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent/20 to-accent2/20 border border-accent/40 text-3xl mb-5 shadow-[0_0_20px_rgba(124,106,255,0.3)] backdrop-blur-md"
          >
            ⚡
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">PrepAgent</h1>
          <p className="text-sm text-[#a5a0c4] font-medium tracking-wide">AI-powered placement preparation</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel rounded-2xl p-7 space-y-6"
        >
          {/* Company */}
          <div>
            <label className="block text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-3">Target Company</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMPANIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCompany(c)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    company === c
                      ? "bg-gradient-to-r from-accent to-[#a594ff] text-white shadow-[0_0_12px_rgba(124,106,255,0.5)] border-transparent"
                      : "bg-[#181724]/50 text-[#a5a0c4] border border-[#2d2c41] hover:border-accent/50 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {company === "Other" && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                type="text"
                value={customCompany}
                onChange={e => setCustomCompany(e.target.value)}
                placeholder="Enter company name"
                className="w-full bg-[#0a0a0f]/50 border border-[#2d2c41] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(124,106,255,0.2)] transition-all"
              />
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-3">Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Software Engineer"
              className="w-full bg-[#0a0a0f]/50 border border-[#2d2c41] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(124,106,255,0.2)] transition-all"
            />
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-3 flex justify-between">
              <span>Timeline</span>
              <span className="text-accent2 font-bold">{timeline} days</span>
            </label>
            <input
              type="range" min={3} max={60} value={timeline}
              onChange={e => setTimeline(+e.target.value)}
              className="w-full accent-accent2 h-1.5 bg-[#2d2c41] rounded-full appearance-none outline-none"
            />
            <div className="flex justify-between text-[10px] text-[#5c5875] font-mono mt-2">
              <span>3 days</span><span>30 days</span><span>60 days</span>
            </div>
          </div>

          {/* Resume upload */}
          <div>
            <label className="block text-[11px] font-mono text-[#a5a0c4] uppercase tracking-widest mb-3">Resume Context (Optional)</label>
            <button
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl py-3.5 text-sm font-medium transition-all duration-300 ${
                resumeText
                  ? "border-accent2/50 text-accent2 bg-accent2/10 shadow-[0_0_15px_rgba(79,217,179,0.15)]"
                  : "border-[#2d2c41] text-[#8e89b2] hover:border-accent/40 hover:bg-accent/5 hover:text-white"
              }`}
            >
              {uploading ? (
                <span className="animate-pulse">Analyzing document...</span>
              ) : resumeText ? (
                <span className="flex items-center justify-center gap-2">✓ Resume context loaded</span>
              ) : (
                "Upload PDF or TXT →"
              )}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(124,106,255,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-accent to-[#9f8fff] text-white font-bold tracking-wide py-3.5 rounded-xl text-sm transition-all"
          >
            Start Prep Session →
          </motion.button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[10px] text-[#5c5875] font-mono mt-6 tracking-widest uppercase"
        >
          LangGraph · ChromaDB · PostgreSQL
        </motion.p>
      </motion.div>
    </div>
  );
}

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
