import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pt-20 pb-10 px-6 border-t border-white/[0.04]">
      {/* Easter Egg */}
      {/* 
        prepx --help
        Usage: prepx [command]
        Commands:
          prepx dsa --company=zepto --difficulty=medium
          prepx resume --file=resume.pdf --target=amazon
          prepx roadmap --weeks=6 --target=faang
        Built with frustration and too much chai.
      */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                <BrainCircuit className="text-[#7C3AED] w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-white">PrepMind AI</span>
            </Link>
            <p className="text-[#64748b] text-sm leading-relaxed max-w-xs">
              Built by students who were tired of scattered prep. One agent, six capabilities, zero guesswork.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-[#64748b]">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#demo" className="hover:text-white transition-colors">Live Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-[#64748b]">
              <li><Link href="#" className="hover:text-white transition-colors">DSA Patterns</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">System Design</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Interview Exp.</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-[#64748b]">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
          <p>© 2026 PrepMind AI</p>
          <p>Built with frustration and too much chai ☕</p>
        </div>
      </div>
    </footer>
  );
}
