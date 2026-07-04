"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COMPANIES = [
  { name: "Google", category: "FAANG", exp: 1240 },
  { name: "Microsoft", category: "FAANG", exp: 980 },
  { name: "Amazon", category: "FAANG", exp: 1550 },
  { name: "Meta", category: "FAANG", exp: 620 },
  { name: "Apple", category: "FAANG", exp: 410 },
  { name: "Atlassian", category: "FAANG", exp: 280 },
  { name: "Flipkart", category: "Indian Unicorns", exp: 890 },
  { name: "Zomato", category: "Indian Unicorns", exp: 450 },
  { name: "Zepto", category: "Indian Unicorns", exp: 320 },
  { name: "Razorpay", category: "Indian Unicorns", exp: 510 },
  { name: "CRED", category: "Indian Unicorns", exp: 290 },
  { name: "PhonePe", category: "Indian Unicorns", exp: 670 },
];

export default function CompanyCoverage() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? COMPANIES : COMPANIES.filter((c) => c.category === filter);

  return (
    <section id="companies" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Prep for the companies
            <br />
            <span className="text-[#94A3B8] font-normal">that actually matter.</span>
          </h2>

          <div className="flex gap-2">
            {["All", "FAANG", "Indian Unicorns"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-md text-xs font-bold font-mono transition-all duration-200 ${
                  filter === tab
                    ? "bg-white/[0.08] text-white border border-white/[0.1]"
                    : "text-[#64748b] hover:text-white border border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((company) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2, rotate: 0.3 }}
                key={company.name}
                className="rounded-xl border border-white/[0.06] bg-[#12121A]/40 p-6 flex flex-col items-start gap-3 transition-[border-color] duration-200 hover:border-[#7C3AED]/30"
              >
                <span className="text-lg font-bold text-white">{company.name}</span>
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#64748b]">
                  {company.exp.toLocaleString()} experiences
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
