"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCcw, CheckCircle2, ChevronRight, Zap, Target } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function DrillPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTopic = params.topic as string;
  const topic = decodeURIComponent(rawTopic || "");
  const sessionId = searchParams.get("session_id");

  const [drills, setDrills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (topic) {
      fetchDrills();
    }
  }, [topic]);

  const fetchDrills = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/drills", {
        topic: topic,
        company: "General",
        role: "Software Engineer"
      });
      setDrills(res.data.drills || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate drills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < drills.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(0);
    setCompleted(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060609] p-8">
        <Loader2 size={48} className="animate-spin text-[#8b5cf6] mb-6" />
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Generating custom drills...</h2>
        <p className="text-[#a5a0c4] text-center max-w-sm">
          Analyzing your weak area in <strong className="text-white">{topic}</strong> and creating targeted practice questions.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060609] p-8">
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-8 max-w-md text-center">
          <div className="text-[#ef4444] mb-4 flex justify-center"><Zap size={48} /></div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Oops!</h2>
          <p className="text-[#a5a0c4] mb-6">{error}</p>
          <button 
            onClick={fetchDrills}
            className="bg-[#2d2c41] hover:bg-[#3f3e58] text-white px-6 py-3 rounded-lg font-bold transition-colors w-full"
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-[#a5a0c4] hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060609] p-8">
        <div className="max-w-md w-full animate-fade-in flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mb-6 border border-[#10b981]/30">
            <CheckCircle2 size={40} className="text-[#10b981]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Great Job!</h1>
          <p className="text-[#a5a0c4] mb-10 text-lg">
            You've completed your targeted drills for <strong className="text-white">{topic}</strong>. Keep practicing to turn this gap into a strength!
          </p>
          
          <div className="flex flex-col w-full gap-4">
            <button 
              onClick={handleRestart}
              className="bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2d2c41] text-white font-bold py-4 rounded-xl transition-all"
            >
              Review Cards Again
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDrill = drills[currentIndex];
  if (!currentDrill) return null;

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-[#2d2c41] bg-[#12121a]/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-[#a5a0c4] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <Target size={20} className="text-[#8b5cf6]" />
          <span className="text-white font-bold tracking-tight">Gap Practice</span>
        </div>
        <div className="text-sm font-medium text-[#5c5875]">
          Card {currentIndex + 1} <span className="mx-1">/</span> {drills.length}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
        <div className="w-full text-center mb-8">
          <h2 className="text-sm font-bold text-[#8b5cf6] uppercase tracking-wider mb-2">Topic</h2>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{topic}</h1>
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-2xl perspective-1000 mb-10 h-[400px]">
          <div 
            className={`w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of card */}
            <div className="absolute inset-0 backface-hidden bg-[#12121a] border-2 border-[#2d2c41] rounded-2xl p-8 flex flex-col hover:border-[#5c5875] transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-[#2d2c41] text-[#a5a0c4] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Question
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-2xl font-medium text-white leading-relaxed">
                  {currentDrill.front}
                </p>
              </div>
              <div className="text-center text-[#5c5875] text-sm font-medium">
                Click anywhere to flip
              </div>
            </div>

            {/* Back of card */}
            <div className="absolute inset-0 backface-hidden bg-[#8b5cf6]/10 border-2 border-[#8b5cf6]/50 rounded-2xl p-8 flex flex-col rotate-y-180 shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-[#8b5cf6]/20 text-[#c084fc] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Answer
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg text-white leading-relaxed whitespace-pre-wrap">
                  {currentDrill.back}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            disabled={isFlipped}
            className="w-full sm:w-auto text-[#a5a0c4] hover:text-white text-sm font-medium transition-colors disabled:opacity-0"
          >
            {showHint ? "Hide Hint" : "Need a hint?"}
          </button>
          
          <button 
            onClick={handleNext}
            className="w-full sm:w-auto bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
          >
            {currentIndex < drills.length - 1 ? "Next Card" : "Finish Practice"} <ChevronRight size={18} />
          </button>
        </div>

        {/* Hint Area */}
        <div className={`w-full max-w-2xl mt-6 transition-all duration-300 overflow-hidden ${showHint && !isFlipped ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-lg p-4 text-[#fbbf24] text-sm">
            <strong>Hint:</strong> {currentDrill.hint}
          </div>
        </div>

      </main>

      {/* Global CSS for 3D flip effects */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
