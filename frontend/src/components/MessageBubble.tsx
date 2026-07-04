"use client";

import { Bot } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex justify-end"
      >
        <div className="max-w-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/40 rounded-2xl rounded-tr-sm px-5 py-4 text-sm text-white shadow-[0_0_20px_rgba(124,106,255,0.15)] backdrop-blur-md font-medium leading-relaxed">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex gap-4 max-w-3xl"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent2/20 to-accent/20 border border-accent2/30 shadow-[0_0_15px_rgba(79,217,179,0.2)] flex items-center justify-center text-accent2 flex-shrink-0">
        <Bot size={20} />
      </div>
      {message.isStreaming && !message.content ? (
        <div className="glass-card border border-white/[0.05] rounded-2xl rounded-tl-sm px-5 py-4">
          <div className="flex gap-2 items-center h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                className="w-2 h-2 rounded-full bg-accent2 shadow-[0_0_8px_rgba(79,217,179,0.8)]"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card border border-white/[0.05] rounded-2xl rounded-tl-sm px-6 py-5 text-sm text-[#e8e6f0] leading-relaxed whitespace-pre-wrap shadow-lg font-medium">
          {message.content}
        </div>
      )}
    </motion.div>
  );
}
