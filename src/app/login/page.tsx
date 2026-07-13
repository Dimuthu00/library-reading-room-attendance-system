"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#542704] text-[#4d2404]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden px-10 py-12 text-center text-white lg:flex lg:flex-col lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(242,185,55,0.17),transparent_34%),radial-gradient(circle_at_75%_78%,rgba(255,255,255,0.08),transparent_26%)]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-[#f2b937]/15" />
          <div className="absolute -right-16 bottom-16 h-56 w-56 rounded-full border border-[#f2b937]/15" />

          <div className="relative z-10 max-w-2xl">
            <div className="mx-auto inline-flex rounded-[2.5rem] bg-[#4d2306] p-3 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
              <Image
                src="/ruhuna-logo.png"
                alt="University of Ruhuna logo"
                width={290}
                height={310}
                priority
                className="h-72 w-auto rounded-[2rem] object-contain xl:h-80"
              />
            </div>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight text-[#f2b937] xl:text-6xl">
              Reading Room Attendance System
            </h1>
            <p className="mt-6 text-2xl font-semibold leading-snug text-white xl:text-3xl">
              Faculty of Engineering
              <br />
              University of Ruhuna
            </p>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-[#542704] px-4 py-8 sm:px-8 lg:bg-transparent lg:px-12">
          <Link
            href="/"
            className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-[#f2b937]/45 bg-[#3d1b03]/55 px-4 py-2 text-sm font-semibold text-[#f7c859] transition hover:bg-[#3d1b03] focus:outline-none focus:ring-4 focus:ring-[#f2b937]/25 lg:left-auto lg:right-8 lg:top-8"
          >
            <span aria-hidden="true">←</span>
            Home
          </Link>

          <div className="w-full max-w-xl rounded-[2rem] border-4 border-[#edb631] bg-[#fff0ce] px-6 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.26)] sm:px-12 sm:py-12">
            <div className="mb-7 flex justify-center lg:hidden">
              <Image
                src="/ruhuna-logo.png"
                alt="University of Ruhuna logo"
                width={120}
                height={130}
                className="h-28 w-auto rounded-2xl object-contain"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a56b1e]">
                Library administration
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#4d2404] sm:text-4xl">
                Log into your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#7a542e] sm:text-base">
                Use your authorized administrator or staff account.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-base font-semibold text-[#4d2404]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path d="M4 6h16v12H4z" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@eng.ruh.ac.lk"
                  className="w-full rounded-full border-2 border-transparent bg-[#efae75] px-5 py-3.5 text-base text-[#4d2404] outline-none placeholder:text-[#74471f]/75 transition focus:border-[#8d4b14] focus:bg-[#f2b682] focus:ring-4 focus:ring-[#edb631]/25"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-base font-semibold text-[#4d2404]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-full border-2 border-transparent bg-[#efae75] px-5 py-3.5 pr-14 text-base text-[#4d2404] outline-none placeholder:text-[#74471f]/75 transition focus:border-[#8d4b14] focus:bg-[#f2b682] focus:ring-4 focus:ring-[#edb631]/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#6d3b13] transition hover:bg-[#fff0ce]/60 focus:outline-none focus:ring-2 focus:ring-[#8d4b14]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path d="m3 3 18 18" />
                        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                        <path d="M9.9 4.2A11.7 11.7 0 0 1 12 4c5.5 0 9 5 9 8a9.6 9.6 0 0 1-2.3 3.8" />
                        <path d="M6.6 6.6C4.3 8 3 10.2 3 12c0 3 3.5 8 9 8 1.2 0 2.3-.2 3.3-.6" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path d="M3 12c0-3 3.5-8 9-8s9 5 9 8-3.5 8-9 8-9-5-9-8Z" />
                        <circle cx="12" cy="12" r="2.6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[#4d2404]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 accent-[#5a2905]"
                  />
                  Remember me
                </label>

                <span className="text-sm font-medium text-[#8a541b]">
                  Contact the library administrator for password help.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#5a2905] px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_28px_rgba(90,41,5,0.25)] transition hover:-translate-y-0.5 hover:bg-[#6b3308] focus:outline-none focus:ring-4 focus:ring-[#edb631]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}