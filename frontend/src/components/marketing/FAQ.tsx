"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "Is PrepMind AI free to use?",
    a: "Yes. The free tier gives you 5 queries per day — enough to explore DSA practice and basic company intel. For unlimited access, resume reviews, and mock interviews, you'd upgrade to Pro at ₹499/month.",
  },
  {
    q: "Which companies does it have data for?",
    a: "50+ companies right now, including Google, Amazon, Microsoft, Meta, Flipkart, Zepto, Razorpay, CRED, and PhonePe. We add new companies every week based on user requests.",
  },
  {
    q: "How is this different from ChatGPT or Gemini?",
    a: "ChatGPT gives you generic text. PrepMind runs a multi-agent DAG that cross-references real interview experiences, scores your resume against ATS systems, and builds a calibrated study roadmap. It's purpose-built for placements, not general conversation.",
  },
  {
    q: "Can I use it for off-campus placements?",
    a: "Yes. Our Company Intel node pulls from both on-campus and off-campus interview experiences. The roadmap adapts regardless of your placement format.",
  },
  {
    q: "How does the resume review work?",
    a: "Paste your resume text or upload a PDF. The Resume Reviewer agent analyzes it against ATS keyword patterns, rewrites weak bullet points using the STAR method, and flags missing skills based on your target company.",
  },
  {
    q: "Is my data private?",
    a: "Your resume, code submissions, and mock interview transcripts are never used to train public models. Your data stays in your session and is not shared with other users.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 border-t border-white/[0.04]">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-16"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
        >
          Questions?
          <br />
          <span className="text-[#94A3B8] font-normal">We&apos;ve got answers.</span>
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-lg border transition-colors duration-200 ${
                  isOpen ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`shrink-0 text-[#64748b] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    size={16}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-[#94A3B8] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
