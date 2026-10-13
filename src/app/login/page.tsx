"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWith(u: string, p: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await loginWith(username, password);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex flex-col justify-center items-center p-4 text-slate-900 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">
        {/* Seyon UPVC Logo & Branding */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <img
              src="/seyon-logo.png"
              alt="Seyon UPVC Logo"
              className="h-24 w-auto object-contain mx-auto drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-2xl font-black text-[#0f3b4c] tracking-tight">
            SEYON UPVC
          </h1>
          <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">
            Windows & Doors • Billing Terminal
          </p>
        </div>

        <div className="border-t border-slate-100 pt-5 mb-5 text-center">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your credentials to access the billing portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] transition-all bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] transition-all bg-slate-50/50"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium leading-normal">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#087ea4] hover:bg-[#076b8b] text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer text-xs"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
