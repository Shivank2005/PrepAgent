import axios from "axios";
import { getAuthToken } from "./store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatStreamPayload {
  session_id?: string;
  company?: string;
  role?: string;
  timeline_days?: number;
  resume_text?: string;
  message: string;
  workflow_only?: boolean;
}

export async function streamChat(
  payload: ChatStreamPayload,
  onData: (data: any) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Backend returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  if (!res.body) {
    throw new Error("Backend did not return a streaming response.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          onData(JSON.parse(line.slice(6)));
        } catch {}
      }
    }
  }
}

export async function uploadResume(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/resume/upload", form);
  return res.data;
}

export async function getNextQuestion(sessionId: string) {
  try {
    const res = await api.get(`/mock/${sessionId}/next-question`);
    return res.data;
  } catch (error) {
    throw normalizeApiError(error, "Unable to fetch the next mock question");
  }
}

export async function evaluateAnswer(sessionId: string, questionId: string, answer: string) {
  try {
    const res = await api.post("/mock/evaluate", {
      session_id: sessionId,
      question_id: String(questionId),
      answer,
    });
    return res.data;
  } catch (error) {
    throw normalizeApiError(error, "Unable to evaluate this mock answer");
  }
}

export async function updateSessionTasks(sessionId: string, completedTasks: Record<string, boolean>) {
  try {
    const res = await api.post(`/sessions/${sessionId}/tasks`, {
      completed_tasks: completedTasks,
    });
    return res.data;
  } catch (error) {
    throw normalizeApiError(error, "Unable to update session tasks");
  }
}

export async function fetchSessionHistory() {
  try {
    const res = await api.get(`/sessions/history`);
    return res.data;
  } catch (error) {
    throw normalizeApiError(error, "Unable to fetch session history");
  }
}

async function readErrorBody(res: Response) {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const data = JSON.parse(text);
      return data.detail || data.error || text;
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}

function normalizeApiError(error: any, fallback: string) {
  let detail = error?.response?.data?.detail || error?.response?.data?.error;
  if (typeof detail === 'object') detail = JSON.stringify(detail);
  const status = error?.response?.status;
  if (detail && status) return new Error(`${fallback}: ${status} ${detail}`);
  if (detail) return new Error(`${fallback}: ${detail}`);
  if (status) return new Error(`${fallback}: backend returned ${status}`);
  if (error?.message === "Network Error") {
    return new Error(`${fallback}: backend is not reachable`);
  }
  return new Error(error?.message || fallback);
}
