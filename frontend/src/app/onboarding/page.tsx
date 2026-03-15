"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, CurrentStatus, EducationStage, CollegeDomain } from "@/lib/api";
import { SpaceAvatarDisplay, AvatarPicker } from "@/components/SpaceAvatar";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  village_area: string;
  phone: string;
  current_status: CurrentStatus | "";
  education_stage: EducationStage | "";
  school_grade: string;
  college_name: string;
  college_domain: CollegeDomain | "";
  activities: string;
  avatar_key: string;
  // Working
  work_designation: string;
  work_company: string;
  work_location: string;
  // Business
  business_type: string;
  business_name: string;
  business_location: string;
  // Farming
  farming_crops: string;
  farming_location: string;
  // Other
  other_detail: string;
}


const STATUS_OPTIONS: { value: CurrentStatus; icon: string; label: string }[] = [
  { value: "studying",  icon: "📚", label: "Studying" },
  { value: "job",       icon: "💼", label: "Working" },
  { value: "business",  icon: "🏪", label: "Business" },
  { value: "farming",   icon: "🌾", label: "Farming" },
  { value: "other",     icon: "✨", label: "Other" },
];

// Only School and College are valid sub-options when "Studying" is selected
const EDUCATION_STAGES: { value: EducationStage; icon: string; label: string }[] = [
  { value: "school",   icon: "🏫", label: "School" },
  { value: "college",  icon: "🎓", label: "College" },
];

const COLLEGE_DOMAINS: { value: CollegeDomain; label: string }[] = [
  { value: "engineering", label: "Engineering" },
  { value: "medicine",    label: "Medicine" },
  { value: "arts",        label: "Arts" },
  { value: "science",     label: "Science" },
  { value: "commerce",    label: "Commerce" },
  { value: "law",         label: "Law" },
  { value: "other",       label: "Other" },
];

// ── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i === current
              ? "w-6 h-2 bg-cyan-400"
              : i < current
              ? "w-2 h-2 bg-cyan-600"
              : "w-2 h-2 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { token, user, setSession } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    village_area: "", phone: "",
    current_status: "", education_stage: "",
    school_grade: "", college_name: "", college_domain: "",
    activities: "", avatar_key: "",
    work_designation: "", work_company: "", work_location: "",
    business_type: "", business_name: "", business_location: "",
    farming_crops: "", farming_location: "",
    other_detail: "",
  });

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const finish = async (avatarKey?: string) => {
    if (!token) { router.push("/dashboard"); return; }
    setSaving(true);

    // Build current_status_detail from status-specific fields
    let statusDetail: string | undefined;
    if (form.current_status === "job") {
      const parts = [form.work_designation, form.work_company && `at ${form.work_company}`, form.work_location].filter(Boolean);
      statusDetail = parts.join(", ") || undefined;
    } else if (form.current_status === "business") {
      const parts = [form.business_type, form.business_name && `(${form.business_name})`, form.business_location].filter(Boolean);
      statusDetail = parts.join(" ") || undefined;
    } else if (form.current_status === "farming") {
      const parts = [form.farming_crops, form.farming_location].filter(Boolean);
      statusDetail = parts.join(", ") || undefined;
    } else if (form.current_status === "other") {
      statusDetail = form.other_detail || undefined;
    }

    try {
      const updated = await updateProfile(token, {
        village_area: form.village_area || undefined,
        phone: form.phone || undefined,
        current_status: (form.current_status as CurrentStatus) || undefined,
        current_status_detail: statusDetail,
        education_stage: form.current_status === "studying" ? (form.education_stage as EducationStage) || undefined : undefined,
        school_grade: form.current_status === "studying" && form.school_grade ? parseInt(form.school_grade) : undefined,
        college_name: form.current_status === "studying" ? form.college_name || undefined : undefined,
        college_domain: form.current_status === "studying" ? (form.college_domain as CollegeDomain) || undefined : undefined,
        activities: form.activities || undefined,
        avatar_key: avatarKey || form.avatar_key || undefined,
      });
      setSession(token, updated);
    } catch { /* non-fatal */ }
    router.push("/dashboard");
  };

  const skip = () => router.push("/dashboard");

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <StepDots current={step} total={3} />

        {/* ── Step 0: Avatar ── */}
        {step === 0 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-2xl font-bold text-slate-100">Hi {firstName}!</h1>
              <p className="text-slate-400 mt-1 text-sm">First, pick an avatar that feels like you</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="mb-6">
                <AvatarPicker selected={form.avatar_key || null} onSelect={key => set("avatar_key", key)} />
              </div>

              {/* Preview */}
              {form.avatar_key && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4">
                  <SpaceAvatarDisplay avatarKey={form.avatar_key} size={48} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">Looking good!</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="btn-primary w-full py-2.5 rounded-xl font-semibold"
              >
                {form.avatar_key ? "Next →" : "Skip, choose later →"}
              </button>
              <button onClick={skip} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors py-2 mt-1">
                Skip all for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Profile ── */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">📍</div>
              <h1 className="text-2xl font-bold text-slate-100">About You</h1>
              <p className="text-slate-400 mt-1 text-sm">Where are you from in the village?</p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  📍 Village Area
                </label>
                <input
                  value={form.village_area}
                  onChange={e => set("village_area", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="e.g. North Street, Temple Road…"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  📱 Phone <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  className="space-input w-full px-4 py-2.5 rounded-xl"
                  placeholder="Your mobile number"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-400 glass border border-white/10 hover:border-white/20 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary flex-1 py-2.5 rounded-xl font-semibold"
                >
                  Next →
                </button>
              </div>
              <button onClick={skip} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors py-1">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Education & Journey ── */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎯</div>
              <h1 className="text-2xl font-bold text-slate-100">Your Journey</h1>
              <p className="text-slate-400 mt-1 text-sm">What are you up to these days?</p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-5">
              {/* Status picker */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">I am currently…</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {STATUS_OPTIONS.map(({ value, icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        set("current_status", value);
                        // Reset sub-fields when switching status
                        setForm(f => ({ ...f, current_status: value, education_stage: "", school_grade: "" }));
                      }}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium border transition-all ${
                        form.current_status === value
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "glass border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── STUDYING sub-section ── */}
              {form.current_status === "studying" && (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-3">I am studying in…</p>
                    <div className="grid grid-cols-2 gap-2">
                      {EDUCATION_STAGES.map(({ value, icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, education_stage: value, school_grade: "" }))}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                            form.education_stage === value
                              ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                              : "glass border-white/10 text-slate-400 hover:border-purple-500/30 hover:text-slate-200"
                          }`}
                        >
                          <span className="text-xl">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* School: grade grid then school name */}
                  {form.education_stage === "school" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Class / Grade</label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => set("school_grade", String(g))}
                              className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                                form.school_grade === String(g)
                                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                  : "glass border-white/10 text-slate-400 hover:border-cyan-500/30"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      {form.school_grade && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">🏫 School Name & Place</label>
                          <input
                            value={form.college_name}
                            onChange={e => set("college_name", e.target.value)}
                            className="space-input w-full px-4 py-2.5 rounded-xl"
                            placeholder="e.g. Govt. High School, V.Muthampatti"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* College: domain + name */}
                  {form.education_stage === "college" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Field of study</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {COLLEGE_DOMAINS.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => set("college_domain", value)}
                              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left ${
                                form.college_domain === value
                                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                  : "glass border-white/10 text-slate-400 hover:border-cyan-500/30"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">🎓 College Name</label>
                        <input
                          value={form.college_name}
                          onChange={e => set("college_name", e.target.value)}
                          className="space-input w-full px-4 py-2.5 rounded-xl"
                          placeholder="e.g. Anna University, PSG College of Technology"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── WORKING sub-section ── */}
              {form.current_status === "job" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">💼 Designation / Role</label>
                    <input
                      value={form.work_designation}
                      onChange={e => set("work_designation", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Software Engineer, Teacher, Nurse"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">🏢 Company / Organisation</label>
                    <input
                      value={form.work_company}
                      onChange={e => set("work_company", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. TCS, Govt School, Apollo Hospital"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">📍 City / Location</label>
                    <input
                      value={form.work_location}
                      onChange={e => set("work_location", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Chennai, Coimbatore, Karur"
                    />
                  </div>
                </>
              )}

              {/* ── BUSINESS sub-section ── */}
              {form.current_status === "business" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">🏪 Type of Business</label>
                    <input
                      value={form.business_type}
                      onChange={e => set("business_type", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Grocery shop, Tailoring, Auto service, Catering"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      🏷 Business Name <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      value={form.business_name}
                      onChange={e => set("business_name", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Sri Murugan Stores, Lakshmi Tailors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">📍 Location</label>
                    <input
                      value={form.business_location}
                      onChange={e => set("business_location", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. V.Muthampatti, Karur, Namakkal"
                    />
                  </div>
                </>
              )}

              {/* ── FARMING sub-section ── */}
              {form.current_status === "farming" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">🌾 What do you farm?</label>
                    <input
                      value={form.farming_crops}
                      onChange={e => set("farming_crops", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. Rice, Sugarcane, Vegetables, Groundnut"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      📍 Farm Location <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      value={form.farming_location}
                      onChange={e => set("farming_location", e.target.value)}
                      className="space-input w-full px-4 py-2.5 rounded-xl"
                      placeholder="e.g. V.Muthampatti fields, near canal"
                    />
                  </div>
                </>
              )}

              {/* ── OTHER sub-section ── */}
              {form.current_status === "other" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">✨ What do you do?</label>
                  <input
                    value={form.other_detail}
                    onChange={e => set("other_detail", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="e.g. Homemaker, Freelancer, Looking for work…"
                    autoFocus
                  />
                </div>
              )}

              {/* Activities / skills — show for all except school-grade step */}
              {form.current_status && !(form.education_stage === "school" && !form.school_grade) && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    ⚡ Skills & Hobbies <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    value={form.activities}
                    onChange={e => set("activities", e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="e.g. Cricket, Drawing, Coding, Cooking…"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-400 glass border border-white/10 hover:border-white/20 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => finish()}
                  disabled={saving}
                  className="btn-primary flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Finish 🎉"}
                </button>
              </div>
              <button onClick={skip} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors py-1">
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
