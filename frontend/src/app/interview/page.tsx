"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Clock, PlayCircle, History, Loader2, ArrowRight, Target, CheckCircle2, PartyPopper, Mic, MicOff, Play, Terminal } from "lucide-react";
import Link from "next/link";
import { getNextQuestion, evaluateAnswer, api, streamChat, executeCode } from "@/lib/api";
import { getActiveSessionId, getAuthToken, clearActiveSessionId, setActiveSessionId } from "@/lib/store";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

const LANGUAGE_BOILERPLATES: Record<string, string> = {
  javascript: `// Write your solution here\n\nfunction solution() {\n  \n}\n`,
  python: `# Write your solution here\n\ndef solution():\n    pass\n`,
  java: `// Write your full program here. \n// A 'public class' with a 'public static void main' is required.\n\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Test your logic here\n        System.out.println("Hello World");\n    }\n}\n`,
  cpp: `// Write your full program here.\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    // Test your logic here\n    cout << "Hello World" << endl;\n    return 0;\n}\n`,
  c: `// Write your full program here.\n#include <stdio.h>\n\nint main() {\n    // Test your logic here\n    printf("Hello World\\n");\n    return 0;\n}\n`,
  typescript: `// Write your solution here\n\nfunction solution(): void {\n  \n}\n`,
  go: `// Write your full program here.\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Test your logic here\n    fmt.Println("Hello World")\n}\n`,
  rust: `// Write your full program here.\n\nfn main() {\n    // Test your logic here\n    println!("Hello World");\n}\n`
};

export default function MockInterview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [codeOutput, setCodeOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "code">("text");
  const [codeLang, setCodeLang] = useState("javascript");
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answer]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [streamProgress, setStreamProgress] = useState<any>({});
  const [feedback, setFeedback] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes (600s) per question

  useEffect(() => {
    if (!currentQuestion) return;
    setCountdown(600);
    
    // TTS: Read the question out loud
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswer((prev) => prev + (prev.endsWith(" ") ? "" : " ") + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) recognitionRef.current.start();
      };
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (inputMode === "code") setInputMode("text");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleRunCode = async () => {
    if (!answer.trim()) return;
    setIsExecuting(true);
    setCodeOutput("");
    try {
      const out = await executeCode(answer, codeLang);
      const result = out.stderr ? `${out.stdout}\n⚠️ ${out.stderr}` : (out.stdout || out.output || "Program finished with no output.");
      setCodeOutput(result.trim());
    } catch (e: any) {
      setCodeOutput(e.message || "Execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (!session?.session_id) return;
    
    const key = `prepagent_timer_${session.session_id}`;
    const savedTime = localStorage.getItem(key);
    if (savedTime) {
      const parsed = parseInt(savedTime, 10);
      if (!isNaN(parsed)) {
        setElapsedTime(parsed);
        elapsedTimeRef.current = parsed;
      }
    }
    
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const nextTime = prev + 1;
        elapsedTimeRef.current = nextTime;
        localStorage.setItem(key, nextTime.toString());
        return nextTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [session?.session_id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const completeInterview = async (idToComplete: string) => {
    try {
      const key = `prepagent_timer_${idToComplete}`;
      const storedStr = localStorage.getItem(key);
      const storedTime = storedStr ? parseInt(storedStr, 10) : 0;
      const finalTime = Math.max(elapsedTimeRef.current, isNaN(storedTime) ? 0 : storedTime);

      await api.post(`/mock/${idToComplete}/complete`, {
        time_taken: finalTime
      });
      localStorage.removeItem(key);
      router.push(`/result/${idToComplete}`);
    } catch (err: any) {
      console.error("Failed to complete session", err);
      alert("Failed to complete session: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this interview session? You cannot resume it later.")) {
      if (session?.session_id) completeInterview(session.session_id);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    const sessionId = getActiveSessionId();
    if (!sessionId) {
      router.push("/setup");
      return;
    }
    loadSessionAndQuestion(sessionId);
  }, [router]);

  const loadSessionAndQuestion = async (sessionId: string) => {
    try {
      setLoading(true);
      const sessionRes = await api.get(`/chat/session/${sessionId}`);
      if (sessionRes.data.status === "COMPLETED") {
        router.push(`/result/${sessionId}`);
        return;
      }
      setSession(sessionRes.data);

      const qRes = await getNextQuestion(sessionId);
      if (qRes.done) {
        completeInterview(sessionId);
      } else {
        setCurrentQuestion(qRes.question);
        setQuestionIndex(qRes.index);
        setTotalQuestions(qRes.total);
        setFeedback(null);
        setAnswer("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || answer.length < 20) return;
    setIsSubmitting(true);
    try {
      const res = await evaluateAnswer(session.session_id, currentQuestion.id || currentQuestion.question_id || `q${questionIndex+1}`, answer);
      setFeedback(res.feedback);
    } catch (err: any) {
      alert("Failed to evaluate: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = async () => {
    await loadSessionAndQuestion(session.session_id);
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-bg0">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg0">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-[#0a0a0f] sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-[#181724]/80 border border-accent/20 px-3 py-1.5 rounded-full text-xs font-medium text-[#a5a0c4] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            {session.company}
          </div>
          <div className="text-white text-sm font-medium">{session.company} Technical Round</div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <span key={i} className={`w-6 h-1 rounded-full ${i <= questionIndex ? 'bg-accent shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-[#2d2c41]'}`} />
            ))}
            <span className="text-[#a5a0c4] ml-2 font-mono">{questionIndex + 1}/{totalQuestions}</span>
          </div>
          
          <div className="flex items-center gap-2 text-[#a5a0c4] font-mono text-sm w-16">
            <Clock size={16} />
            {formatTime(elapsedTime)}
          </div>
          
          <button onClick={handleEndSession} className="text-sm text-[#a5a0c4] hover:text-[#ef4444] transition-colors font-medium">
            End Session
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-y-auto custom-scrollbar">
        
        {/* Left Column: Question & Coding Pad (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-fit">
          <div className="glass-card rounded-2xl border border-[#2d2c41] bg-[#12121a]/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Visual Countdown Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#2d2c41]">
              <div 
                className={`h-full transition-all duration-1000 ${countdown < 60 ? 'bg-[#ff6b6b] animate-pulse' : 'bg-accent'}`} 
                style={{ width: `${(countdown / 600) * 100}%` }}
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#a5a0c4]">Q{questionIndex + 1}</span>
                <span className="text-xs font-bold text-[#ff6b6b] border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {currentQuestion?.difficulty || "Medium"}
                </span>
                <span className="text-xs font-bold text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <TargetIcon /> {currentQuestion?.topic || "Technical"}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-medium text-white leading-relaxed tracking-wide">
                {currentQuestion?.question}
              </h2>
            </div>

            {currentQuestion?.context && (
              <div className="bg-[#101928]/50 border border-accent/20 rounded-xl p-5 border-l-4 border-l-accent mt-8">
                <div className="text-xs font-medium text-accent mb-2">Interviewer context:</div>
                <p className="text-sm text-[#777294] leading-relaxed">
                  {currentQuestion.context}
                </p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-[#2d2c41] bg-[#12121a]/80 flex flex-col overflow-hidden min-h-[480px]">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-[#12121a]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 opacity-70">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex bg-[#060609] p-1 rounded-lg border border-white/5 ml-2">
                  <button onClick={() => setInputMode("text")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${inputMode === "text" ? "bg-[#2d2c41] text-white" : "text-[#5c5875] hover:text-white"}`}>Text/Voice</button>
                  <button 
                    onClick={() => {
                      setInputMode("code");
                      if (!answer.trim() || Object.values(LANGUAGE_BOILERPLATES).some(b => b.trim() === answer.trim())) {
                        setAnswer(LANGUAGE_BOILERPLATES[codeLang]);
                      }
                    }} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${inputMode === "code" ? "bg-[#2d2c41] text-white" : "text-[#5c5875] hover:text-white"}`}>
                    Code
                  </button>
                </div>
                {inputMode === "code" && (
                  <select 
                    value={codeLang} 
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setCodeLang(newLang);
                      if (!answer.trim() || Object.values(LANGUAGE_BOILERPLATES).some(b => b.trim() === answer.trim())) {
                        setAnswer(LANGUAGE_BOILERPLATES[newLang]);
                      }
                    }}
                    className="ml-2 bg-[#060609] text-white text-xs font-bold border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent/50 cursor-pointer"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="typescript">TypeScript</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isListening ? 'bg-[#ff6b6b]/20 border-[#ff6b6b]/50 text-[#ff6b6b] animate-pulse' : 'bg-[#2d2c41]/50 border-white/10 text-[#a5a0c4] hover:bg-[#2d2c41]'}`}
                >
                  {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                  {isListening ? "Listening..." : "Dictate"}
                </button>
                <span className="text-xs font-mono text-[#5c5875] bg-[#060609] px-3 py-1 rounded-full border border-white/5">{answer.length} chars</span>
              </div>
            </div>
            
            <div className="w-full flex flex-col bg-[#0a0a0f] relative flex-1 min-h-[380px]">
              {inputMode === "code" ? (
                <div className="w-full h-full">
                  <Editor
                    height="380px"
                    language={codeLang === "cpp" ? "cpp" : codeLang === "c" ? "c" : codeLang}
                    theme="vs-dark"
                    value={answer}
                    loading={<div className="flex items-center justify-center h-[380px] text-[#5c5875]">Loading Editor...</div>}
                    onChange={(val) => setAnswer(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "monospace",
                      padding: { top: 16 },
                      readOnly: !!feedback || isSubmitting
                    }}
                  />
                  {codeOutput && (
                    <div className="h-32 bg-black border-t border-white/10 p-4 overflow-y-auto font-mono text-xs text-gray-300">
                      <div className="text-[#a5a0c4] mb-1 font-bold">Terminal Output:</div>
                      <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!!feedback || isSubmitting}
                  className="w-full min-h-[380px] bg-transparent p-6 text-white font-mono text-sm resize-none focus:outline-none placeholder:text-[#5c5875]/50 leading-[26px] disabled:opacity-70"
                  placeholder="Type or dictate your answer here..."
                />
              )}
            </div>
            
            <div className="p-5 bg-[#0a0a0f] flex items-center justify-between border-t border-white/[0.02]">
              <div className="flex items-center gap-3">
                {inputMode === "code" && (
                  <button 
                    onClick={handleRunCode}
                    disabled={isExecuting || !answer.trim() || !!feedback}
                    className="bg-[#2d2c41] hover:bg-[#3f3e58] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run Code
                  </button>
                )}
              </div>
              {!feedback ? (
                <button 
                  onClick={submitAnswer}
                  disabled={isSubmitting || answer.length < 20 || countdown === 0}
                  className="bg-gradient-to-r from-accent to-[#3b82f6] hover:from-[#06b6d4] hover:to-[#2563eb] disabled:from-[#2d2c41] disabled:to-[#2d2c41] disabled:text-[#5c5875] text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none flex items-center gap-2 group"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  Submit Answer
                </button>
              ) : (
                <div className="text-sm font-bold text-[#4fd9b3] flex items-center gap-2 bg-[#4fd9b3]/10 px-5 py-2.5 rounded-xl border border-[#4fd9b3]/20">
                  <CheckCircle2 size={16} /> Submitted successfully
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Interviewer Chat & Feedback (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-fit">
          {/* Persona Card */}
          <div className="glass-card rounded-xl border border-[#2d2c41] bg-[#12121a]/80 p-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#5c5875] font-bold uppercase tracking-wider">Interviewer Persona</div>
              <div className="text-sm font-bold text-white mt-0.5">{session.interviewer_persona || "Standard Recruiter"}</div>
            </div>
            <div className="text-xs text-[#a5a0c4] bg-[#2d2c41]/50 px-3 py-1.5 rounded-lg border border-white/5">
              Time Remaining: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {feedback && (
            <div className="glass-card rounded-2xl border border-accent/50 bg-[#12121a]/90 p-6 flex flex-col gap-4 animate-fade-in shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-lg">Evaluation</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded font-bold text-sm ${feedback.score_delta > 0 ? 'bg-[#4fd9b3]/20 text-[#4fd9b3]' : feedback.score_delta < 0 ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]' : 'bg-[#fbbf24]/20 text-[#fbbf24]'}`}>
                    {feedback.score_delta > 0 ? '+' : ''}{feedback.score_delta} Score
                  </span>
                  <span className="text-xs text-[#a5a0c4] px-2 py-1 bg-[#2d2c41] rounded">{feedback.score_label}</span>
                </div>
              </div>
              <p className="text-sm text-white leading-relaxed">{feedback.feedback}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-[#4fd9b3]/5 border border-[#4fd9b3]/20 p-4 rounded-lg">
                  <h4 className="text-xs font-bold text-[#4fd9b3] uppercase tracking-wider mb-2">Strengths</h4>
                  <ul className="list-disc pl-4 text-sm text-[#a5a0c4] space-y-1">
                    {feedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    {!feedback.strengths?.length && <li>None noted.</li>}
                  </ul>
                </div>
                <div className="bg-[#ff6b6b]/5 border border-[#ff6b6b]/20 p-4 rounded-lg">
                  <h4 className="text-xs font-bold text-[#ff6b6b] uppercase tracking-wider mb-2">To Improve</h4>
                  <ul className="list-disc pl-4 text-sm text-[#a5a0c4] space-y-1">
                    {feedback.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    {!feedback.improvements?.length && <li>None noted.</li>}
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={nextQuestion}
                  className="bg-white hover:bg-gray-200 text-[#060609] font-bold px-8 py-3 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
                >
                  Next Question <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// Simple internal icon for the badge
function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
