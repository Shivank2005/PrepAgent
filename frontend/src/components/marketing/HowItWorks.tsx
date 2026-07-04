"use client";
import { motion } from "framer-motion";

const NODES = [
  { id: "query_analyzer", title: "Query Analyzer", desc: "Parses your question and determines which sub-agents to invoke." },
  { id: "dsa_coach", title: "DSA Coach", desc: "Generates company-specific coding problems matched to your weak areas." },
  { id: "resume_reviewer", title: "Resume Reviewer", desc: "Scores your resume against ATS systems and rewrites weak bullets." },
  { id: "company_intel", title: "Company Intel", desc: "Retrieves real interview experiences from the last 3 years via RAG." },
  { id: "roadmap_gen", title: "Roadmap Generator", desc: "Builds a week-by-week study plan calibrated to your timeline." },
  { id: "synthesizer", title: "Synthesizer", desc: "Merges all outputs into a single, streaming response." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          Your agent runs in 6 steps.<br />
          <span className="text-[#94A3B8] font-normal">Here&apos;s exactly what happens.</span>
        </h2>

        <div
          className="mt-16 flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {NODES.map((node, i) => {
            const isLast = i === NODES.length - 1;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -2, rotate: 0.3 }}
                className={`relative shrink-0 min-w-[240px] md:min-w-0 rounded-xl border p-6 bg-[#12121A]/60 transition-[border-color] duration-200 ${
                  isLast
                    ? 'border-[#7C3AED]/40 shadow-[0_0_30px_rgba(124,58,237,0.08)]'
                    : 'border-white/[0.06] hover:border-[#7C3AED]/30'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                <span className="font-mono text-[11px] text-[#555] block mb-4">{node.id}</span>
                <h3 className="text-lg font-bold text-white mb-2">{node.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{node.desc}</p>

                {/* Dashed connector — hidden on last card and on mobile */}
                {!isLast && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-4">
                    <div className="border-t border-dashed border-white/[0.15] w-full" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
