"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, login, CurrentStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";

const STATUSES: { value: CurrentStatus; label: string }[] = [
  { value: "job", label: "Working / Job" },
  { value: "studying", label: "Studying" },
  { value: "business", label: "Business" },
  { value: "farming", label: "Farming" },
  { value: "other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    village_area: "",
    current_status: "" as CurrentStatus | "",
    current_status_detail: "",
    education: "",
    bio: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await signup({
        ...form,
        current_status: (form.current_status as CurrentStatus) || undefined,
      });
      // Auto-login so user can complete their profile (add photo, etc.) while pending
      const data = await login(form.email, form.password);
      setSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-slate-100">Join Village Connect</h1>
          <p className="text-slate-400 mt-1">Create your profile and get approved by the admin</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Google OAuth — same pending-approval flow */}
          <GoogleButton label="Sign up with Google" />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-500 font-medium">or fill in the form</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="you@example.com"
                />
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="border-t border-white/5 pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-4">Profile Info</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Village / Area</label>
                  <input
                    value={form.village_area}
                    onChange={(e) => set("village_area", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="e.g. North Street, Keelattur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Currently</label>
                  <select
                    value={form.current_status}
                    onChange={(e) => set("current_status", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent"
                  >
                    <option value="" className="bg-[#030b1a]">Select…</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-[#030b1a]">{s.label}</option>
                    ))}
                  </select>
                </div>
                {form.current_status && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Details</label>
                    <input
                      value={form.current_status_detail}
                      onChange={(e) => set("current_status_detail", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Software Engineer at Infosys"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Education</label>
                  <input
                    value={form.education}
                    onChange={(e) => set("education", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="e.g. B.E. Computer Science, Anna University"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">About me</label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl resize-none"
                    placeholder="A short intro about yourself…"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Phone <span className="text-slate-500 font-normal">(visible to members only)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="+91 99999 99999"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-xl"
            >
              {loading ? "Creating profile…" : "Create Profile"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already a member?{" "}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
