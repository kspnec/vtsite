"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const full_name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
    if (!full_name) { setError("Please enter your name"); return; }
    setLoading(true);
    try {
      await signup({ full_name, email: form.email, password: form.password });
      const data = await login(form.email, form.password);
      setSession(data.access_token, data.user);
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-slate-100">Join VTRockers Connect</h1>
          <p className="text-slate-400 mt-1 text-sm">Takes 30 seconds — complete your profile after joining</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <GoogleButton label="Sign up with Google" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-500 font-medium">or create an account</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.first_name}
                  onChange={e => set("first_name", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="e.g. Arjun"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Initial <span className="text-red-400">*</span>
                  <span className="text-slate-500 font-normal ml-1 text-xs">(e.g. K)</span>
                </label>
                <input
                  required
                  value={form.last_name}
                  onChange={e => set("last_name", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="K"
                  maxLength={20}
                  style={{ width: "80px" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set("email", e.target.value)}
                className="space-input w-full px-4 py-2.5 rounded-xl"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                className="space-input w-full px-4 py-2.5 rounded-xl"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-xl font-semibold"
            >
              {loading ? "Creating account…" : "Join VTRockers Connect"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
            Your profile will be visible after admin approval.
          </p>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already a member?{" "}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
