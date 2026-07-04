"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTABanner() {
  return (
    <section className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
          >
            Your placement season has a deadline.
            <br />
            <span className="text-[#A78BFA]">This doesn&apos;t.</span>
          </h2>
          <p className="text-[#94A3B8] text-lg mb-10 max-w-lg">
            Join 10,000+ students already prepping with an agent that actually knows what your target company asks.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#A78BFA] transition-colors duration-200"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
          <p className="text-[#64748b] text-xs mt-4">No credit card. No spam. Just prep.</p>
        </motion.div>
      </div>
    </section>
  );
}
