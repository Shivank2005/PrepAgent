"use client";
import { useState, useEffect } from "react";
import { BrainCircuit, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#companies", label: "Companies" },
  { href: "#pricing", label: "Pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md border-b border-white/5 bg-[#0A0A0F]/80"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
            <BrainCircuit className="text-[#7C3AED] w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            PrepMind <span className="text-[#A78BFA]">AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setActiveLink(link.href)}
              className="relative text-sm font-medium text-[#94A3B8] hover:text-white transition-colors py-1"
            >
              {link.label}
              {activeLink === link.href && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7C3AED]"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden md:inline-flex px-5 py-2 rounded-lg border border-[#7C3AED] text-[#7C3AED] font-semibold text-sm hover:bg-[#7C3AED] hover:text-white transition-all duration-200"
          >
            Start Free
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[#94A3B8] hover:text-white"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden border-t border-white/5 bg-[#0A0A0F]/95 backdrop-blur-md px-6 pb-6 pt-4 space-y-4"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="block w-full text-center px-5 py-3 rounded-lg border border-[#7C3AED] text-[#7C3AED] font-semibold text-sm hover:bg-[#7C3AED] hover:text-white transition-all"
            >
              Start Free
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
