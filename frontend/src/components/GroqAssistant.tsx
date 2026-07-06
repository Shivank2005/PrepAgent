"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { getActiveSessionId } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function GroqAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your PrepAgent Study Assistant. How can I help you prep today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getActiveSessionId();

  // Load chat history from localStorage
  useEffect(() => {
    if (!sessionId) return;
    const stored = localStorage.getItem(`chat_history_${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    } else {
      setMessages([{ role: "assistant", content: "Hi! I'm your PrepAgent Study Assistant. How can I help you prep today?" }]);
    }
  }, [sessionId]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    if (messages.length === 1 && messages[0].role === "assistant" && messages[0].content.includes("How can I help")) return;
    localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages));
  }, [messages, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const sessionId = getActiveSessionId();
    if (!sessionId) {
      setMessages(prev => [...prev, 
        { role: "user", content: input },
        { role: "assistant", content: "You don't have an active prep session right now! Go to **Prep Setup** to create one so I can give you personalized contextual advice." }
      ]);
      setInput("");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:9001/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          history: messages.filter(m => m.role !== "assistant" || !m.content.includes("active prep session")),
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = { ...newMessages[newMessages.length - 1] };
            lastMsg.content += chunk;
            newMessages[newMessages.length - 1] = lastMsg;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = { ...newMessages[newMessages.length - 1] };
        if (lastMsg.role === "user") {
          newMessages.push({ role: "assistant", content: "Oops! Something went wrong connecting to PrepAgent. Check your API key and server logs." });
        } else {
          lastMsg.content = "Oops! Something went wrong connecting to PrepAgent. Check your API key and server logs.";
          newMessages[newMessages.length - 1] = lastMsg;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.1 }}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-black to-[#1a1b26] border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center text-white z-50 ${isOpen ? 'pointer-events-none' : ''}`}
      >
        <Sparkles size={24} className="text-white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-[#0c0c11] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#12121a] to-[#0c0c11] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">PrepAgent Assistant</h3>
                  <p className="text-[10px] text-[#5c5875] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Powered by PrepAgent
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[#5c5875] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-accent/20 border border-accent/30 text-accent" : "bg-white/5 border border-white/10 text-white"
                  }`}>
                    {msg.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl p-4 text-[14px] leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-li:my-1 prose-ul:my-2 prose-ol:my-2 prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-sm prose-p:first-of-type:mt-0 ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-accent to-[#0ea5e9] text-white rounded-tr-none shadow-md shadow-accent/20" 
                      : "bg-gradient-to-br from-[#1e1e2e] to-[#14141f] border border-white/10 text-gray-100 rounded-tl-none shadow-lg"
                  }`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-gradient-to-br from-[#1e1e2e] to-[#14141f] border border-white/10 shadow-lg rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 h-[42px]">
                    <div className="w-1.5 h-1.5 bg-[#8b85b1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#8b85b1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#8b85b1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-[#0a0a0f]">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your study plan..."
                  disabled={isLoading}
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-[#5c5875] focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
