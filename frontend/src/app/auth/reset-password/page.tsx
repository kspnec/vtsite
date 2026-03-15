"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (!token) { setError("Invalid reset link"); return; }
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Password Reset!</h1>
        <p className="text-slate-400">Redirecting to login…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-slate-100">Set New Password</h1>
        </div>
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <input type="password" required minLength={6} value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <input type="password" required minLength={6} value={form.confirm}
                onChange={e => setForm(f => ({...f, confirm: e.target.value}))}
                className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Repeat password" />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 rounded-xl">
              {loading ? "Resetting…" : "Set New Password"}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">← Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><p className="text-slate-400">Loading…</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
