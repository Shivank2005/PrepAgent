"use client";
import { motion } from "framer-motion";

const PROBLEMS = [
  { num: "01", title: "Blind prep", desc: "You don't know what the company actually asked last season." },
  { num: "02", title: "Wrong words", desc: "Your resume has the right experience but the wrong words." },
  { num: "03", title: "No pacing", desc: "You've done 200 LC problems and still can't pace yourself in interviews." },
  { num: "04", title: "Conflicting advice", desc: "Every prep resource gives you a different roadmap." },
  { num: "05", title: "One-size prep", desc: "You're prepping for Amazon the same way as you'd prep for a startup." },
  { num: "06", title: "No signal", desc: "Nobody tells you when you're ready. You just guess." },
];

export default function ProblemStatement() {
  return (
    <section id="problem" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Left — Sticky */}
          <div className="lg:col-span-2 lg:sticky lg:top-32 lg:self-start">
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 leading-tight"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              The honest reason most students don&apos;t get placed
            </h2>
            <p className="text-[#64748b] text-sm leading-relaxed">
              It&apos;s not that you&apos;re not smart enough. It&apos;s that the system is fragmented and nobody connects the dots for you.
            </p>
          </div>

          {/* Right — Scrolling List */}
          <div className="lg:col-span-3 space-y-10">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group"
              >
                <span className="block font-mono text-3xl font-bold text-white/[0.06] mb-2 select-none">
                  {p.num}
                </span>
                <h3 className="text-lg font-bold text-white mb-1">{p.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-md">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
