"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "dag", label: "DAG" },
  { id: "state", label: "Agent State" },
];

export default function LiveDemo() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <section id="demo" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            See it in action.
          </h2>
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-xs font-bold font-mono transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white/[0.08] text-white"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Browser Frame */}
        <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c14]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e16]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
            <span className="ml-3 text-[11px] text-[#555] font-mono">prepmind.ai/dashboard</span>
          </div>

          <div className="p-6 min-h-[320px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "chat" && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl space-y-4 text-left">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] shrink-0" />
                    <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-3 rounded-xl rounded-tl-sm text-sm text-[#94A3B8] max-w-sm">
                      What DP problems does Google ask in on-campus rounds?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                    </div>
                    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/10 px-4 py-3 rounded-xl rounded-tl-sm text-sm text-[#e8e6f0] flex-1 space-y-2">
                      <p>Based on 847 Google interview experiences (2023-2025), the most frequent DP patterns are:</p>
                      <div className="bg-black/30 p-2.5 rounded-md font-mono text-[11px] text-[#6b7280]">
                        1. Interval scheduling &middot; 2. Matrix chain &middot; 3. Knapsack variants
                      </div>
                      <p className="text-[#A78BFA] animate-pulse text-xs">Generating practice problems...</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "dag" && (
                <motion.div key="dag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 font-mono text-xs overflow-x-auto py-4">
                  {["query_analyzer", "company_intel", "dsa_coach", "synthesizer"].map((n, i) => (
                    <div key={n} className="flex items-center gap-4">
                      <div className={`shrink-0 px-4 py-3 rounded-lg border ${
                        i === 1 ? "border-[#06B6D4]/50 text-[#06B6D4] bg-[#06B6D4]/5" : "border-white/[0.06] text-[#555]"
                      }`}>
                        {n}
                      </div>
                      {i < 3 && <div className="border-t border-dashed border-white/[0.12] w-8" />}
                    </div>
                  ))}
                </motion.div>
              )}
              {activeTab === "state" && (
                <motion.div key="state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md bg-black/20 border border-white/[0.06] p-5 rounded-lg text-left font-mono text-[12px] space-y-1">
                  <div className="text-[#555]">{"// agent state dump"}</div>
                  <div><span className="text-[#06B6D4]">&quot;current_node&quot;</span>: <span className="text-white">&quot;company_intel&quot;</span>,</div>
                  <div><span className="text-[#06B6D4]">&quot;weak_areas&quot;</span>: <span className="text-white">[&quot;DP&quot;, &quot;Graphs&quot;]</span>,</div>
                  <div><span className="text-[#06B6D4]">&quot;rag_docs_retrieved&quot;</span>: <span className="text-white">12</span>,</div>
                  <div className="animate-pulse"><span className="text-[#06B6D4]">&quot;streaming&quot;</span>: <span className="text-[#A78BFA]">true</span></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
          >
            Try it yourself <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
