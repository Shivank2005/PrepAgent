"use client";

import { useState, useEffect } from "react";
import { Bot, ChevronRight, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { setAuthToken, setUserData, getAuthToken } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (getAuthToken()) {
      router.push("/dashboard");
    }
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.access_token);
      setUserData(res.data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] w-[100vw] bg-[#0a0a0f] absolute inset-0 z-50 overflow-y-auto pt-10 pb-10">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8b5cf6]/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10b981]/10 blur-[120px] rounded-full" />
      </div>

      <div className="z-10 w-full max-w-md p-8 glass-card border border-[#2d2c41] rounded-2xl shadow-2xl bg-[#12121a]/80 backdrop-blur-xl mx-4 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#c084fc] mb-4 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Bot size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-[#a5a0c4] text-sm mt-1">Sign in to continue your interview prep</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-[#ef4444] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#181724] border border-[#2d2c41] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#8b5cf6] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#181724] border border-[#2d2c41] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#8b5cf6] transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <button 
                type="button" 
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'bg-[#181724] border-[#2d2c41]'}`}
              >
                {rememberMe && <Check size={14} className="text-white" />}
              </button>
              <span className="ml-2 text-sm text-[#a5a0c4]" onClick={() => setRememberMe(!rememberMe)}>Remember Me</span>
            </div>
            <Link href="#" className="text-sm text-[#8b5cf6] hover:text-[#a855f7] transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="mt-6 mb-6 relative flex items-center justify-center">
          <div className="border-t border-[#2d2c41] w-full absolute"></div>
          <span className="bg-[#12121a] px-3 text-xs text-[#5c5875] relative z-10 uppercase font-semibold tracking-wider">Or continue with</span>
        </div>
        
        <button
          type="button"
          onClick={() => alert("Google Auth coming soon!")}
          className="w-full bg-white hover:bg-gray-100 text-[#12121a] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-8 text-center text-sm text-[#5c5875]">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#8b5cf6] hover:text-[#a855f7] font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
