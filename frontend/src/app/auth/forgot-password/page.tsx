"use client";
import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch { /* intentionally silent — always show success */ }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-slate-100">Reset Password</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>
        <div className="glass rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <p className="text-slate-100 font-semibold">Check your inbox</p>
              <p className="text-slate-400 text-sm">
                If an account exists for <span className="text-cyan-400">{email}</span>, a reset link has been sent. Check spam if you don&apos;t see it.
              </p>
              <p className="text-slate-500 text-xs">The link expires in 1 hour.</p>
              <Link href="/auth/login" className="block btn-primary text-center py-2.5 rounded-xl mt-4">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 rounded-xl">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <p className="text-center text-sm text-slate-500">
                <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">← Back to Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
