"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api, streamChat } from "@/lib/api";
import { setActiveSessionId, getAuthToken } from "@/lib/store";

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "Unknown";
  const role = searchParams.get("role") || "SDE-1 / Entry Level";
  const timelineDays = searchParams.get("timeline") ? parseInt(searchParams.get("timeline") as string, 10) : 14;
  const prevSessionId = searchParams.get("prev");

  const hasStarted = useRef(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    const generateSession = async () => {
      try {
        // Create new session
        const sessionRes = await api.post("/chat/session", {
          company,
          role,
          timeline_days: timelineDays,
          previous_session_id: prevSessionId || undefined
        });
        const newSessionId = sessionRes.data.session_id;

        // Stream pipeline to generate questions
        await streamChat({
          session_id: newSessionId,
          company,
          role,
          timeline_days: timelineDays,
          message: "Generate new mock test",
          workflow_only: true,
          force_step: prevSessionId ? "mock_questions" : undefined
        }, (chunk) => {
          if (chunk.mock_questions) {
            // Done!
            setActiveSessionId(newSessionId);
            router.push("/interview");
          }
        });
      } catch (err: any) {
        alert("Failed to generate new session: " + err.message);
        router.push("/dashboard");
      }
    };

    generateSession();
  }, [company, role, timelineDays, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-bg0 p-8">
      <Loader2 className="animate-spin text-accent mb-4" size={48} />
      <h2 className="text-2xl font-bold text-white mb-2">Preparing your next mock session...</h2>
      <p className="text-[#a5a0c4]">Generating new questions and setting up the environment.</p>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-full w-full bg-bg0"><Loader2 className="animate-spin text-accent" size={48} /></div>}>
      <GenerateContent />
    </Suspense>
  );
}
