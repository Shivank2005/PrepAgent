"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ChevronRight, LayoutDashboard, Target, Briefcase, BrainCircuit, Sparkles, MessageSquare, Menu, X, CheckCircle2 } from "lucide-react";
import { getAuthToken } from "@/lib/store";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
              <a href="#features" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">How it Works</a>
              <a href="#benefits" className="text-[#a5a0c4] hover:text-white transition-colors text-sm font-medium">Benefits</a>
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
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">How it Works</a>
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-[#a5a0c4] hover:text-white">Benefits</a>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#c084fc] text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>AI-Powered Interview Preparation</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Master your next interview with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#c084fc]">PrepAgent AI</span>
          </h1>
          <p className="text-xl text-[#a5a0c4] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume and let our LangGraph RAG pipeline build a personalized study roadmap, identify your weak areas, and conduct real-time mock interviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={handleGetStarted} className="px-8 py-4 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2">
              Get Started <ChevronRight size={20} />
            </button>
            <a href="#features" className="px-8 py-4 rounded-xl bg-[#2d2c41]/50 hover:bg-[#2d2c41] border border-[#2d2c41] text-white font-bold text-lg transition-all flex items-center justify-center backdrop-blur-sm">
              Learn More
            </a>
          </div>
          
          {/* Dashboard Preview Mockup */}
          <div className="mt-20 w-full max-w-5xl relative rounded-2xl overflow-hidden border border-[#2d2c41] shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0f] z-10 pointer-events-none" style={{height: '100%', top: '60%'}}></div>
            <div className="bg-[#12121a] h-8 flex items-center px-4 border-b border-[#2d2c41]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              </div>
            </div>
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="w-full opacity-40 object-cover h-[400px]" />
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 bg-[#12121a]/50 border-y border-[#2d2c41]/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Capabilities</h2>
              <p className="text-[#a5a0c4] max-w-2xl mx-auto">Everything you need to land your dream job, powered by cutting-edge AI.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Briefcase, title: "Resume Analysis", desc: "AI parses your resume to understand your exact skills and experience level." },
                { icon: Target, title: "Personalized Study Plans", desc: "Custom roadmaps generated based on your target company and role." },
                { icon: BrainCircuit, title: "LangGraph Workflows", desc: "Advanced agentic workflows break down your prep into structured phases." },
                { icon: Sparkles, title: "RAG Knowledge Retrieval", desc: "Our AI pulls from a vast database of real interview questions and system design concepts." },
                { icon: MessageSquare, title: "Mock Interviews", desc: "Practice with a realistic AI interviewer that adapts to your responses." },
                { icon: LayoutDashboard, title: "Progress Tracking", desc: "Monitor your readiness score and track task completion in real-time." },
              ].map((feature, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl border border-[#2d2c41] hover:border-[#8b5cf6]/50 transition-colors bg-[#0a0a0f]/50">
                  <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center text-[#c084fc] mb-4">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-[#a5a0c4] text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-[#a5a0c4] max-w-2xl mx-auto">Four simple steps to your next offer.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Upload Resume", desc: "Provide your current resume and target role." },
                { step: "02", title: "AI Analyzes", desc: "Our LangGraph pipeline analyzes your skill gaps." },
                { step: "03", title: "Get Roadmap", desc: "Receive a personalized day-by-day study plan." },
                { step: "04", title: "Practice", desc: "Take mock interviews and improve your score." },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-6xl font-black text-[#2d2c41]/50 absolute -top-6 -left-4 z-0 pointer-events-none">{item.step}</div>
                  <div className="relative z-10 pt-4">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-[#a5a0c4] text-sm">{item.desc}</p>
                  </div>
                  {i < 3 && <div className="hidden md:block absolute top-8 right-[-2rem] w-8 border-t-2 border-dashed border-[#2d2c41]"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits & Testimonials */}
        <div id="benefits" className="py-24 bg-[#12121a]/50 border-y border-[#2d2c41]/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Why choose PrepAgent?</h2>
                <ul className="space-y-4">
                  {[
                    "Stop guessing what to study next",
                    "Practice with hyper-realistic technical questions",
                    "Get immediate, actionable feedback on your answers",
                    "Visually track your interview readiness score"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#10b981]">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-[#a5a0c4]">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleGetStarted} className="mt-8 px-6 py-3 rounded-xl bg-[#2d2c41] hover:bg-[#3d3c51] text-white font-bold transition-all flex items-center gap-2">
                  Create free account <ChevronRight size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { text: "PrepAgent's mock interviews felt exactly like my actual Meta loop. The system design feedback was incredibly accurate.", author: "Sarah J., L5 Engineer" },
                  { text: "The personalized study plan saved me hundreds of hours of wandering. I knew exactly what to study every day.", author: "Michael T., Backend Developer" }
                ].map((testimonial, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#0a0a0f] border border-[#2d2c41] relative">
                    <div className="absolute top-4 right-6 text-4xl text-[#8b5cf6]/20 font-serif">"</div>
                    <p className="text-[#a5a0c4] italic mb-4 relative z-10">{testimonial.text}</p>
                    <p className="text-sm font-bold text-white">— {testimonial.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "Do I need a technical background to use this?", a: "Yes, PrepAgent is specifically designed for software engineers, data scientists, and technical product managers." },
                { q: "How does the AI evaluate my answers?", a: "We use a multi-agent LangGraph workflow backed by specialized RAG context to evaluate the accuracy, structure, and depth of your answers." },
                { q: "Is my resume data kept private?", a: "Absolutely. We do not share your resume data with any third parties or use it to train base models." }
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-xl bg-[#12121a] border border-[#2d2c41]">
                  <h4 className="text-lg font-bold mb-2">{faq.q}</h4>
                  <p className="text-[#a5a0c4] text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#2d2c41] py-12 bg-[#0a0a0f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#c084fc]">
                <Bot size={18} />
              </div>
              <span className="font-bold tracking-tight">PrepAgent</span>
            </div>
            
            <div className="flex gap-6 text-sm text-[#5c5875]">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
            
            <div className="text-sm text-[#5c5875]">
              © 2026 PrepAgent AI. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
