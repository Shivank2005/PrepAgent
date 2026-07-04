"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

const TERMINAL_LINES = [
  '> analyzing resume for Amazon SDE-1...',
  '  found 3 keyword gaps: "distributed systems", "API design", "trade-offs"',
  '> pulling 847 interview experiences from Amazon (2023-2025)',
  '  generating 6-week roadmap with 94% topic coverage...',
];

function TerminalMockup() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) return;
    const line = TERMINAL_LINES[visibleLines];
    if (currentChar < line.length) {
      const timer = setTimeout(() => setCurrentChar((c) => c + 1), 25);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setVisibleLines((v) => v + 1);
        setCurrentChar(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visibleLines, currentChar]);

  return (
    <div className="w-full max-w-xl rounded-xl border border-white/[0.06] bg-[#0c0c14] overflow-hidden font-mono text-[13px] leading-relaxed">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e16]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
        <span className="ml-3 text-[11px] text-[#555]">prepmind agent — zsh</span>
      </div>
      <div className="p-4 min-h-[140px] space-y-1">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-[#A78BFA]' : 'text-[#6b7280]'}>{line}</div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <div className={TERMINAL_LINES[visibleLines].startsWith('>') ? 'text-[#A78BFA]' : 'text-[#6b7280]'}>
            {TERMINAL_LINES[visibleLines].slice(0, currentChar)}
            <span className="inline-block w-[7px] h-[15px] bg-[#A78BFA] ml-0.5 animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  const students = useCountUp(10000);
  const companies = useCountUp(50);
  const offerRate = useCountUp(94);

  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <span className="font-mono text-sm text-[#64748b] block mb-6">
              {'//'} built by students who didn&apos;t get placed the first time
            </span>

            <h1
              className="font-bold tracking-tight text-white mb-6 leading-[1.15]"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
            >
              Still prepping from 11 different tabs?
              <br />
              <span className="text-[#A78BFA]">We fixed that.</span>
            </h1>

            <p className="text-[#94A3B8] text-lg leading-relaxed mb-10 max-w-lg">
              Six weeks before your campus drive, you probably have LeetCode open,
              a half-done resume, and zero clue what Zepto actually asks.
              PrepMind pulls it all into one agent.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-[#7C3AED] text-[#7C3AED] font-semibold text-sm hover:bg-[#7C3AED] hover:text-white transition-all duration-200"
              >
                Start Preparing <ArrowRight size={16} />
              </Link>
              <button className="inline-flex items-center gap-2 px-5 py-3.5 text-[#94A3B8] hover:text-white font-medium text-sm transition-colors">
                <PlayCircle size={18} /> Watch Demo
              </button>
            </div>

            {/* Stats — 2x2 on mobile, row on desktop */}
            <div className="grid grid-cols-2 md:flex md:gap-10 gap-6">
              <div>
                <span ref={students.ref} className="text-2xl font-bold text-white font-mono">{students.count.toLocaleString()}+</span>
                <span className="block text-xs text-[#64748b] mt-1">students</span>
              </div>
              <div>
                <span ref={companies.ref} className="text-2xl font-bold text-white font-mono">{companies.count}+</span>
                <span className="block text-xs text-[#64748b] mt-1">companies</span>
              </div>
              <div>
                <span ref={offerRate.ref} className="text-2xl font-bold text-[#06B6D4] font-mono">{offerRate.count}%</span>
                <span className="block text-xs text-[#64748b] mt-1">offer rate</span>
              </div>
            </div>
          </div>

          {/* Right — Terminal */}
          <div className="hidden lg:block">
            <TerminalMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
