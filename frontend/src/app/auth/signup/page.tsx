"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, login, EducationStage, CollegeDomain } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";

const COLLEGE_DOMAINS: { value: CollegeDomain; label: string }[] = [
  { value: "engineering", label: "Engineering / Technology" },
  { value: "medicine", label: "Medicine / Health Sciences" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "science", label: "Pure Sciences" },
  { value: "commerce", label: "Commerce / Business" },
  { value: "law", label: "Law" },
  { value: "other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    education_stage: "" as EducationStage | "",
    school_grade: "",
    college_domain: "" as CollegeDomain | "",
    college_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await signup({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        education_stage: (form.education_stage as EducationStage) || undefined,
        school_grade: form.school_grade ? parseInt(form.school_grade) : undefined,
        college_domain: (form.college_domain as CollegeDomain) || undefined,
        college_name: form.college_name || undefined,
      });
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
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-slate-100">Join Village Connect</h1>
          <p className="text-slate-400 mt-1 text-sm">Quick sign-up — complete your profile after joining</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <GoogleButton label="Sign up with Google" />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-500 font-medium">or create an account</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
              <input required value={form.full_name} onChange={e => set("full_name", e.target.value)}
                className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
              <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password *</label>
                <input type="password" required minLength={6} value={form.password} onChange={e => set("password", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Min 6 chars" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm *</label>
                <input type="password" required minLength={6} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Repeat" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">I am currently *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["school", "college", "working", "other"] as EducationStage[]).map(stage => (
                  <button key={stage} type="button"
                    onClick={() => set("education_stage", stage)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all capitalize ${
                      form.education_stage === stage
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "glass border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
                    }`}>
                    {stage === "school" ? "🏫 School" : stage === "college" ? "🎓 College" : stage === "working" ? "💼 Working" : "✨ Other"}
                  </button>
                ))}
              </div>
            </div>

            {form.education_stage === "school" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Class / Grade</label>
                <select value={form.school_grade} onChange={e => set("school_grade", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
                  <option value="" className="bg-[#030b1a]">Select grade…</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g} className="bg-[#030b1a]">Class {g}</option>
                  ))}
                </select>
              </div>
            )}

            {form.education_stage === "college" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Field of Study</label>
                  <select value={form.college_domain} onChange={e => set("college_domain", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
                    <option value="" className="bg-[#030b1a]">Select field…</option>
                    {COLLEGE_DOMAINS.map(d => <option key={d.value} value={d.value} className="bg-[#030b1a]">{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">College / University</label>
                  <input value={form.college_name} onChange={e => set("college_name", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. Anna University" />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 rounded-xl">
              {loading ? "Creating account…" : "Join Village Connect"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already a member?{" "}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
