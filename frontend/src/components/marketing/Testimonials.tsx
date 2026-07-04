"use client";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "PrepMind's company intel for Zepto was insanely accurate. I practiced the exact routing algorithms they asked and got an offer in 2 rounds.",
    name: "Ananya S.",
    college: "BITS Pilani",
    company: "Zepto",
    companyColor: "#e23744",
  },
  {
    quote: "The resume reviewer tore my old resume apart, rewrote my impact bullets, and I went from 0 to 4 shortlists in a single week.",
    name: "Rohan K.",
    college: "NIT Trichy",
    company: "Microsoft",
    companyColor: "#00a4ef",
  },
  {
    quote: "The roadmap feature gave me a strict 6-week plan for Amazon. I followed it exactly, tracking my weak areas, and cracked it.",
    name: "Sneha P.",
    college: "VJTI Mumbai",
    company: "Amazon",
    companyColor: "#ff9900",
  },
  {
    quote: "I was mass-applying with the same resume everywhere. PrepMind showed me exactly which keywords each company scans for. Game over.",
    name: "Karthik R.",
    college: "IIT Madras",
    company: "Google",
    companyColor: "#4285f4",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-16"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          Students who used PrepMind<br />
          <span className="text-[#94A3B8] font-normal">got placed.</span>
        </h2>

        <div
          className="flex gap-6 overflow-x-auto pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -2, rotate: 0.3 }}
              className="shrink-0 w-[340px] border-l-[3px] border-l-[#7C3AED] pl-6 pr-4 py-2 transition-[transform] duration-200"
              style={{ scrollSnapAlign: 'start' }}
            >
              <p className="italic text-white/90 text-[15px] leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <div className="text-sm font-medium text-white">{t.name}</div>
                <div className="text-xs text-[#64748b]">{t.college}</div>
                <div className="text-xs font-bold mt-1" style={{ color: t.companyColor }}>
                  → {t.company}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
