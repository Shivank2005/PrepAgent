"use client";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const TIERS = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    desc: "Explore the platform. No card needed.",
    features: ["5 queries per day", "DSA practice mode", "Basic company intel", "Community support"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/mo",
    desc: "Unlimited access to everything. Most students pick this.",
    features: ["Unlimited queries", "Resume ATS review", "Adaptive study roadmap", "Live mock interviews", "Priority generation queue"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "₹1999",
    period: "/mo for 5",
    desc: "For friend groups prepping together.",
    features: ["Shared credit pool", "Group admin panel", "Collaborative roadmaps", "Discord premium channel"],
    cta: "Contact Us",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Simple pricing.
            <br />
            <span className="text-[#94A3B8] font-normal">Built for students, not enterprises.</span>
          </h2>
          <span className="inline-block mt-4 px-3 py-1 rounded-md bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-mono font-bold">
            save 30% annually
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -2, rotate: 0.3 }}
              className={`relative rounded-xl border p-8 transition-[transform,border-color] duration-200 ease-out ${
                tier.highlight
                  ? "bg-[#12121A] border-[#7C3AED]/40"
                  : "bg-[#12121A]/40 border-white/[0.06] hover:border-[#7C3AED]/30"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-[#7C3AED] text-white text-[10px] font-bold font-mono uppercase rounded-md tracking-wider">
                  Most Popular
                </span>
              )}

              <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-4">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-white font-mono">{tier.price}</span>
                {tier.period && <span className="text-[#64748b] text-sm">{tier.period}</span>}
              </div>
              <p className="text-sm text-[#94A3B8] mb-8">{tier.desc}</p>

              <button
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 mb-8 ${
                  tier.highlight
                    ? "bg-[#7C3AED] text-white hover:bg-[#A78BFA]"
                    : "border border-white/[0.1] text-white hover:border-[#7C3AED]/50 hover:text-[#A78BFA]"
                }`}
              >
                {tier.cta}
              </button>

              <div className="space-y-3">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <Check size={15} className="text-[#06B6D4] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#94A3B8]">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
