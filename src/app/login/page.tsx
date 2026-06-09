"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setEmailError(false);
    setPasswordError(false);
    
    if (!email) setEmailError(true);
    if (!password) setPasswordError(true);
    
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f2ee] p-4 font-sans">
      <div className="max-w-105 w-full bg-white rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-10 pt-12 pb-14">
        {/* Logo Circle */}
        <div className="flex justify-center mb-8 relative">
          <div className="w-18 h-18 rounded-full bg-[#dfc4a2] flex items-center justify-center shadow-[0_8px_20px_rgba(223,196,162,0.4)] relative">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.2" 
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 text-[#7d5b4a]"
            >
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-10 space-y-4">
          <h1 className="text-[32px] font-semibold text-[#7d5b4a] tracking-tight">Reading Room Attendant System</h1>
          <p className="text-[15px] text-[#a89689]">Sign in to access the admin dashboard.</p>
        </div>

        {error && (
          <div className="bg-[#f0dfd8]/30 text-[#d87c5f] p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                placeholder="Email address"
                className="w-full px-5 py-4 rounded-xl border border-[#e28e73] bg-[#fdfaf9] focus:ring-1 focus:ring-[#e28e73] focus:border-[#e28e73] outline-none transition-all text-[#e28e73] placeholder:text-[#e28e73]/80 text-[15px]"
              />
            </div>
            {emailError ? (
              <p className="text-[#e28e73] text-[13px] mt-2 ml-1">Email address is required</p>
            ) : (
              <p className="text-transparent text-[13px] mt-2 ml-1 select-none">Spacer</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                placeholder="Password"
                className="w-full px-5 py-4 rounded-xl border border-[#e28e73] bg-[#fdfaf9] focus:ring-1 focus:ring-[#e28e73] focus:border-[#e28e73] outline-none transition-all text-[#e28e73] placeholder:text-[#e28e73]/80 pr-14 text-[15px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#e28e73]/70 hover:text-[#e28e73] transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {!showPassword ? (
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError ? (
              <p className="text-[#e28e73] text-[13px] mt-2 ml-1">Please enter your password</p>
            ) : (
              <p className="text-transparent text-[13px] mt-2 ml-1 select-none">Spacer</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 pb-4">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-4.5 h-4.5 border-[1.5px] border-[#ecdcd2] rounded-sm checked:bg-[#dfc4a2] checked:border-[#dfc4a2] transition-all cursor-pointer bg-white"
                />
                <svg
                  className="absolute w-3 h-3 text-[#7d5b4a] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[14.5px] text-[#7d5b4a]">Remember me</span>
            </label>
            <button
              type="button"
              className="text-[14.5px] font-semibold text-[#bcaaa0] hover:text-[#a89689] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e3c4a2] hover:bg-[#d6b48f] text-[#7d5b4a] font-medium text-[16px] py-3.75 px-4 rounded-xl transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}