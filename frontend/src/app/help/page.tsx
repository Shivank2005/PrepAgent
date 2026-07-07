"use client";

import { LifeBuoy, FileText, MessageCircle, Github, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How does the PrepAgent mock interview work?",
    a: "PrepAgent uses a multi-agent RAG workflow. First, it parses your resume and searches our Vector DB for the most recent interview questions from your target company. Then, a LangGraph agent orchestrates a personalized mock interview where you can practice in real-time."
  },
  {
    q: "Can I use PrepAgent without uploading a resume?",
    a: "Yes! While uploading a resume helps tailor the questions to your specific background and identifies 'gaps' in your knowledge, you can skip the resume upload and just select a target company to get general role-based questions."
  },
  {
    q: "Is my data stored securely?",
    a: "All resume parsing happens securely. We do not use your personal information to train any models, and your session data is isolated."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex flex-col h-full w-full bg-[#060609] overflow-y-auto custom-scrollbar">
      <header className="px-8 py-12 border-b border-white/[0.05] bg-[url('/grid-bg.png')] bg-center bg-cover relative">
        <div className="absolute inset-0 bg-[#060609]/80 backdrop-blur-sm z-0" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-accent/20 border-2 border-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <LifeBuoy size={32} className="text-accent" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">How can we help you?</h1>
          <p className="text-lg text-[#a5a0c4] max-w-2xl mx-auto">Explore our documentation, read frequently asked questions, or get in touch with the development team.</p>
        </div>
      </header>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 -mt-16 relative z-20">
            {[
              { title: "Documentation", icon: FileText, desc: "Read the full guide on how to use PrepAgent." },
              { title: "Community Discord", icon: MessageCircle, desc: "Join other candidates practicing for interviews." },
              { title: "GitHub Repository", icon: Github, desc: "Report issues or contribute to the source code." }
            ].map(link => (
              <div key={link.title} className="glass-card p-6 rounded-xl border border-white/[0.05] bg-[#12121a] hover:border-accent/50 hover:bg-[#181724] transition-all cursor-pointer group shadow-xl">
                <link.icon size={28} className="text-accent mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
                  {link.title}
                  <ExternalLink size={14} className="text-[#5c5875] group-hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-[#a5a0c4]">{link.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div 
                    key={i} 
                    className={`border rounded-xl transition-all overflow-hidden ${isOpen ? 'border-accent/50 bg-[#12121a]' : 'border-white/[0.05] bg-[#0a0a0f] hover:border-white/20'}`}
                  >
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className={`font-semibold ${isOpen ? 'text-white' : 'text-[#a5a0c4]'}`}>{faq.q}</span>
                      <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : 'text-[#5c5875]'}`} />
                    </button>
                    <div 
                      className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <p className="text-sm text-[#777294] leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
