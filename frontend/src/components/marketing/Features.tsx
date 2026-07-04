"use client";
import { Brain, FileCheck, Building, Target, Activity, GitGraph } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Brain, title: "DSA Practice", desc: "Curated problems matched to your target company and difficulty. Not random grinding — directed practice.", wide: true },
  { icon: FileCheck, title: "Resume AI", desc: "ATS scoring, bullet rewrites, keyword gaps. Your resume stops getting auto-rejected.", wide: false },
  { icon: Building, title: "Company Intel", desc: "Real interview experiences pulled from the last 3 years. Know what they actually ask.", wide: false },
  { icon: Target, title: "Study Roadmap", desc: "Week-by-week plan adapted to your timeline and weak areas.", wide: false },
  { icon: Activity, title: "Streaming Chat", desc: "Watch the AI think in real-time. Every token streamed via SSE.", wide: false },
  { icon: GitGraph, title: "DAG Visualizer", desc: "See your agent's reasoning graph update live as it switches between analysis nodes.", wide: true },
];

function DSAMockup() {
  return (
    <div className="mt-6 rounded-lg border border-white/[0.05] bg-[#0c0c14] p-3 font-mono text-[11px] text-[#6b7280] space-y-1">
      <div className="text-[#A78BFA]">→ Amazon SDE-1 · Medium · Arrays</div>
      <div className="text-white/60">Given an array of intervals, merge all overlapping intervals.</div>
      <div className="text-[#06B6D4] mt-2">Hint: Sort by start time, then linear scan.</div>
    </div>
  );
}

function DAGMockup() {
  return (
    <div className="mt-6 flex items-center gap-3 font-mono text-[10px] overflow-x-auto pb-2">
      {["query_analyzer", "rag_retrieval", "weak_area_scan", "synthesizer"].map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <div className={`shrink-0 px-3 py-2 rounded-md border ${
            i === 1 ? 'border-[#06B6D4]/50 text-[#06B6D4] bg-[#06B6D4]/5' : 'border-white/[0.06] text-[#555]'
          }`}>
            {n}
          </div>
          {i < 3 && <span className="text-white/10">---</span>}
        </div>
      ))}
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          Six things.<br />
          <span className="text-[#94A3B8] font-normal">Each one something you actually needed.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mt-16">
          {FEATURES.map((f, i) => {
            const isWide = f.wide;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-2xl border border-white/[0.06] bg-[#12121A]/60 p-8 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#7C3AED]/40 ${
                  isWide ? 'md:col-span-3' : 'md:col-span-2'
                } ${
                  /* Row 3 reversal: items 4(narrow) and 5(wide) */
                  i === 4 ? 'md:col-span-2' : ''
                }${
                  i === 5 ? 'md:col-span-3' : ''
                }`}
                style={{ ['--tw-rotate' as string]: '0deg' }}
                whileHover={{ rotate: 0.3 }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                  <f.icon className="text-[#A78BFA] w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{f.desc}</p>
                {i === 0 && <DSAMockup />}
                {i === 5 && <DAGMockup />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
