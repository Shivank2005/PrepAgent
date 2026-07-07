"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ChevronRight, LayoutDashboard, Target, Briefcase, BrainCircuit, Sparkles, MessageSquare, Menu, X, CheckCircle2, ChevronDown } from "lucide-react";
import { getAuthToken } from "@/lib/store";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden selection:bg-[#8b5cf6]/30 absolute inset-0 z-50 overflow-y-auto">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8b5cf6]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-[#c084fc]/10 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#2d2c41]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#c084fc] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Bot size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight">PrepAgent</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">Platform</a>
              <a href="#how-it-works" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">Workflow</a>
              <a href="#benefits" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">Testimonials</a>
              <a href="#faq" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">FAQ</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="text-sm font-bold text-white hover:text-[#c084fc] transition-colors">Dashboard</Link>
                  <button onClick={() => { localStorage.clear(); setIsLoggedIn(false); }} className="px-5 py-2.5 rounded-xl bg-[#2d2c41] hover:bg-[#3d3c51] text-white text-sm font-bold transition-all">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-bold text-[#a5a0c4] hover:text-white transition-colors">Login</Link>
                  <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#a5a0c4] hover:text-white">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#12121a] border-b border-[#2d2c41] px-4 pt-2 pb-6 space-y-4 shadow-xl">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">Platform</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">Workflow</a>
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">Testimonials</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">FAQ</a>
            <div className="pt-4 border-t border-[#2d2c41] flex flex-col gap-3">
              {isLoggedIn ? (
                <Link href="/dashboard" className="w-full text-center px-5 py-3 rounded-xl bg-[#8b5cf6] text-white font-bold">Go to Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="w-full text-center px-5 py-3 rounded-xl bg-[#2d2c41] text-white font-bold">Login</Link>
                  <Link href="/signup" className="w-full text-center px-5 py-3 rounded-xl bg-[#8b5cf6] text-white font-bold">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium mb-8">
              <Sparkles size={16} />
              <span>The Next Generation of AI Interview Prep</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white">
              Land your dream role with <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-600">PrepAgent AI</span>
            </h1>
            <p className="text-xl text-[#a5a0c4] max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Upload your resume and let our autonomous LangGraph agents build your roadmap, identify skill gaps, and conduct hyper-realistic technical interviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center lg:justify-start">
              <button onClick={handleGetStarted} className="px-8 py-4 rounded-xl bg-white hover:bg-gray-200 text-black font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transform hover:-translate-y-1">
                Start Practicing Free <ChevronRight size={20} />
              </button>
              <a href="#features" className="px-8 py-4 rounded-xl bg-black hover:bg-[#111111] border border-white/10 text-white font-bold text-lg transition-all flex items-center justify-center transform hover:-translate-y-1">
                View Features
              </a>
            </div>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-[#5c5875] text-sm font-medium">
              <span>Trusted by engineers at</span>
              <div className="flex gap-4 opacity-50 grayscale">
                <span className="font-bold text-white tracking-widest">META</span>
                <span className="font-bold text-white tracking-widest">GOOGLE</span>
                <span className="font-bold text-white tracking-widest">NETFLIX</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="flex-1 w-full relative"
          >
            {/* Animated Floating Dashboard Preview */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.5)] bg-[#050505]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-0 pointer-events-none"></div>
              <div className="bg-[#0a0a0a] h-10 flex items-center px-4 border-b border-white/5 relative z-10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="w-full opacity-30 object-cover h-[350px] relative z-10 mix-blend-screen grayscale" />
            </motion.div>
            {/* Floating accent elements */}
            <motion.div 
              animate={{ y: [10, -10, 10], rotate: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-8 bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-4 hidden sm:flex"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-white font-bold">Offer Received</div>
                <div className="text-[#888888] text-sm">L5 Software Engineer</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Marquee Banner */}
        <div className="w-full border-y border-[#222222] bg-[#050505] overflow-hidden py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex whitespace-nowrap gap-16 md:gap-32 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
            >
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-16 md:gap-32 items-center text-[#888888] font-bold tracking-[0.2em] text-xs md:text-sm">
                  <span>SOFTWARE ENGINEER</span>
                  <span><div className="w-1.5 h-1.5 rounded-full bg-[#444444]"></div></span>
                  <span>PRODUCT MANAGER</span>
                  <span><div className="w-1.5 h-1.5 rounded-full bg-[#444444]"></div></span>
                  <span>DATA SCIENTIST</span>
                  <span><div className="w-1.5 h-1.5 rounded-full bg-[#444444]"></div></span>
                  <span>MACHINE LEARNING</span>
                  <span><div className="w-1.5 h-1.5 rounded-full bg-[#444444]"></div></span>
                  <span>SYSTEMS ARCHITECT</span>
                  <span><div className="w-1.5 h-1.5 rounded-full bg-[#444444]"></div></span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bento Features Section */}
        <div id="features" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-[#888888]">Everything you need to succeed</h2>
              <p className="text-xl text-[#888888] max-w-2xl mx-auto">We've built a comprehensive suite of AI tools designed specifically for rigorous technical interviews.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              {/* Feature 1 - Large */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-2 rounded-3xl bg-[#0a0a0a] border border-[#222222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-8 flex flex-col justify-between overflow-hidden relative group hover:border-[#444444] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-black mb-6">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Hyper-Realistic Mock Interviews</h3>
                  <p className="text-[#888888] text-lg max-w-md">Our AI doesn't just ask questions—it listens, asks follow-ups, and pushes you on system design trade-offs just like a real L6 engineer.</p>
                </div>
              </motion.div>
              
              {/* Feature 2 - Small */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl bg-[#0a0a0a] border border-[#222222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-8 flex flex-col justify-between group hover:border-[#444444] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-white mb-6">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Resume Parsing</h3>
                  <p className="text-[#888888]">Instantly extracts your experience and skills to tailor the interview difficulty to your exact background.</p>
                </div>
              </motion.div>

              {/* Feature 3 - Small */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl bg-[#0a0a0a] border border-[#222222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-8 flex flex-col justify-between group hover:border-[#444444] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-white mb-6">
                    <Target size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Adaptive Roadmaps</h3>
                  <p className="text-[#888888]">Stop guessing what to study. We generate a day-by-day plan tailored to your target company.</p>
                </div>
              </motion.div>

              {/* Feature 4 - Large */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="md:col-span-2 rounded-3xl bg-[#0a0a0a] border border-[#222222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-8 flex flex-col justify-between overflow-hidden relative group hover:border-[#444444] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-black mb-6">
                    <BrainCircuit size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">LangGraph Agentic Workflows</h3>
                  <p className="text-[#888888] text-lg max-w-md">Powered by multi-agent architectures that simulate a panel of interviewers. From algorithmic coding to complex system architecture.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Your path to the <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#888888]">offer letter</span></h2>
              <p className="text-xl text-[#888888] max-w-2xl mx-auto">Four simple steps separating you from your dream job.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Upload Resume", desc: "We extract your experience to calibrate the AI interviewer." },
                { step: "02", title: "Gap Analysis", desc: "Our RAG pipeline identifies your weaknesses against top companies." },
                { step: "03", title: "Get Roadmap", desc: "A customized day-by-day study plan is generated instantly." },
                { step: "04", title: "Practice", desc: "Take unlimited mock interviews and track your readiness." },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-6 rounded-3xl bg-[#0a0a0a] border border-[#222222] hover:border-[#444444] transition-colors overflow-hidden"
                >
                  <div className="text-7xl font-black text-white/[0.03] absolute top-2 right-4 z-0 pointer-events-none select-none">{item.step}</div>
                  <div className="relative z-10 pt-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-bold text-xl mb-6">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                    <p className="text-[#888888] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials & CTA */}
        <div id="benefits" className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">Stop guessing.<br/>Start preparing.</h2>
                <ul className="space-y-6">
                  {[
                    "Stop wandering through endless Leetcode problems",
                    "Practice with hyper-realistic technical deep-dives",
                    "Get immediate, actionable feedback on your system design",
                    "Visually track your interview readiness score to know when you're ready"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-white flex items-center justify-center text-black flex-shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-[#888888] text-lg leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleGetStarted} className="mt-10 px-8 py-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-lg transition-all flex items-center gap-2 transform hover:-translate-y-1">
                  Create your free account <ChevronRight size={20} />
                </button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {[
                  { text: "PrepAgent's mock interviews felt exactly like my actual Meta loop. The system design feedback was incredibly accurate and harsh in the best way.", author: "Sarah J.", role: "L5 Software Engineer at Meta" },
                  { text: "The personalized study plan saved me hundreds of hours of wandering. I knew exactly what to study every day, and I crushed my Google onsite.", author: "Michael T.", role: "Senior Backend Developer" }
                ].map((testimonial, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-[#0a0a0a] border border-[#222222] relative hover:border-[#444444] transition-colors">
                    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                      <span className="font-serif text-2xl leading-none pt-2">"</span>
                    </div>
                    <p className="text-[#cccccc] text-lg italic mb-6 relative z-10 leading-relaxed">"{testimonial.text}"</p>
                    <div>
                      <p className="text-base font-bold text-white">{testimonial.author}</p>
                      <p className="text-sm text-[#888888] font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="py-24 relative overflow-hidden">
          {/* Subtle background glow for the FAQ section */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#8b5cf6]/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#a5a0c4]">Frequently Asked Questions</h2>
              <p className="text-lg text-[#a5a0c4] max-w-2xl mx-auto">Everything you need to know about how PrepAgent works to get you interview-ready.</p>
            </div>
            
            <div className="space-y-4 w-full">
              {[
                { q: "Do I need a technical background to use this?", a: "Yes, PrepAgent is specifically designed for software engineers, data scientists, and technical product managers." },
                { q: "How does the AI evaluate my answers?", a: "We use a multi-agent LangGraph workflow backed by specialized RAG context to evaluate the accuracy, structure, and depth of your answers." },
                { q: "Is my resume data kept private?", a: "Absolutely. We do not share your resume data with any third parties or use it to train base models." },
                { q: "How accurate is the interview simulation?", a: "Our AI agents are trained on thousands of real interview transcripts from top tech companies to perfectly mimic real interviewers." }
              ].map((faq, i) => (
                <div 
                  key={i} 
                  className={`overflow-hidden transition-all duration-300 rounded-2xl border ${
                    openFaq === i 
                      ? 'bg-white/[0.05] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                      : 'bg-[#0a0a0a] border-[#222222] hover:border-[#444444] shadow-none'
                  }`}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex justify-between items-center focus:outline-none group"
                  >
                    <h4 className="text-lg font-bold text-white pr-8 group-hover:text-[#cccccc] transition-colors">{faq.q}</h4>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-white/10 text-white' : 'bg-white/5 text-[#888888] group-hover:bg-white/10 group-hover:text-white'}`}>
                      <ChevronDown size={18} className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <div 
                    className={`px-6 transition-all duration-300 ease-in-out ${openFaq === i ? 'pb-6 opacity-100 max-h-40' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-[#888888] text-base leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#222222] bg-[#000000] pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black">
                    <Bot size={22} />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">PrepAgent AI</span>
                </div>
                <p className="text-[#888888] text-sm leading-relaxed max-w-sm mb-6">
                  The ultimate AI-powered interview preparation platform for ambitious software engineers and product managers.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="w-8 h-8 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#888888] hover:text-white hover:border-[#444444] transition-all"><Bot size={14}/></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#888888] hover:text-white hover:border-[#444444] transition-all"><MessageSquare size={14}/></a>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Platform</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Mock Interviews</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Study Plans</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-[#555555] hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-[#222222] flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-[#555555]">
                © 2026 PrepAgent AI. All rights reserved.
              </div>
              <div className="text-sm text-[#555555] flex items-center gap-1">
                Built with <span className="text-white">♥</span> for tech professionals
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
