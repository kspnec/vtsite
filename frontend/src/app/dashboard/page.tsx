"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, uploadPhoto, UserAdminView, CurrentStatus, EducationStage, CollegeDomain, AchievementOut } from "@/lib/api";
import { AvatarPicker, SpaceAvatarDisplay } from "@/components/SpaceAvatar";

type Tab = "profile" | "education" | "avatar";

const STATUSES: { value: CurrentStatus; label: string }[] = [
  { value: "job", label: "Working / Job" },
  { value: "studying", label: "Studying" },
  { value: "business", label: "Business" },
  { value: "farming", label: "Farming" },
  { value: "other", label: "Other" },
];

const COLLEGE_DOMAINS: { value: CollegeDomain; label: string }[] = [
  { value: "engineering", label: "Engineering / Technology" },
  { value: "medicine", label: "Medicine / Health Sciences" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "science", label: "Pure Sciences" },
  { value: "commerce", label: "Commerce / Business" },
  { value: "law", label: "Law" },
  { value: "other", label: "Other" },
];

const ACHIEVEMENT_CATEGORY_ICONS: Record<string, string> = {
  academic: "📚",
  sports: "🏆",
  cultural: "🎭",
  community: "🤝",
  leadership: "⭐",
};

export default function DashboardPage() {
  const { user, token, setSession, isApproved } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [achievements, setAchievements] = useState<AchievementOut[]>([]);

  const [form, setForm] = useState({
    full_name: "",
    village_area: "",
    current_status: "" as CurrentStatus | "",
    current_status_detail: "",
    education: "",
    bio: "",
    phone: "",
    // Education
    education_stage: "" as EducationStage | "",
    school_grade: "" as number | "",
    college_name: "",
    college_domain: "" as CollegeDomain | "",
    graduation_year: "" as number | "",
    sports: "",
    activities: "",
    // Avatar
    avatar_key: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    if (user) {
      const u = user as UserAdminView & {
        education_stage?: EducationStage;
        school_grade?: number;
        college_name?: string;
        college_domain?: CollegeDomain;
        graduation_year?: number;
        sports?: string;
        activities?: string;
        avatar_key?: string;
      };
      setForm({
        full_name: u.full_name ?? "",
        village_area: u.village_area ?? "",
        current_status: u.current_status ?? "",
        current_status_detail: u.current_status_detail ?? "",
        education: u.education ?? "",
        bio: u.bio ?? "",
        phone: u.phone ?? "",
        education_stage: u.education_stage ?? "",
        school_grade: u.school_grade ?? "",
        college_name: u.college_name ?? "",
        college_domain: u.college_domain ?? "",
        graduation_year: u.graduation_year ?? "",
        sports: u.sports ?? "",
        activities: u.activities ?? "",
        avatar_key: u.avatar_key ?? "",
      });
      // Load achievements
      if (u.id && token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/profiles/${u.id}/achievements`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []).then((data: AchievementOut[]) => setAchievements(data)).catch(() => {});
      }
    }
  }, [user, token, router]);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(token, {
        ...form,
        current_status: (form.current_status as CurrentStatus) || undefined,
        education_stage: (form.education_stage as EducationStage) || undefined,
        school_grade: form.school_grade ? Number(form.school_grade) : undefined,
        college_domain: (form.college_domain as CollegeDomain) || undefined,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : undefined,
        avatar_key: form.avatar_key || undefined,
      });
      setSession(token, updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const { photo_url } = await uploadPhoto(token, file);
      setSession(token, { ...(user as UserAdminView), photo_url });
    } catch {
      setError("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const initials = user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const currentAvatarKey = form.avatar_key;
  const userWithPoints = user as UserAdminView & { points?: number };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">My Profile</h1>
      <p className="text-slate-400 mb-4 text-sm">
        {isApproved ? "Your profile is live and visible to everyone." : "⏳ Pending admin approval — your profile will go public once approved."}
      </p>
      {!isApproved && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-amber-300">
          Complete your profile while you wait — it goes live the moment you&apos;re approved!
        </div>
      )}

      {/* Profile header card */}
      <div className="glass rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="relative">
          {user.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt={user.full_name} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover" />
          ) : currentAvatarKey ? (
            <SpaceAvatarDisplay avatarKey={currentAvatarKey} size={64} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-100">{user.full_name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          {userWithPoints.points ? (
            <p className="text-xs text-cyan-400 mt-1">⭐ {userWithPoints.points} points</p>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["profile", "education", "avatar"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-500/30"
                : "glass text-slate-400 border border-white/5 hover:border-cyan-500/20 hover:text-slate-200"
            }`}>
            {t === "profile" ? "👤 Profile" : t === "education" ? "🎓 Education & Skills" : "🚀 Avatar"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {tab === "profile" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input required value={form.full_name} onChange={e => set("full_name", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Village / Area</label>
              <input value={form.village_area} onChange={e => set("village_area", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. North Street, Keelattur" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Currently</label>
              <select value={form.current_status} onChange={e => set("current_status", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
                <option value="" className="bg-[#030b1a]">Select…</option>
                {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-[#030b1a]">{s.label}</option>)}
              </select>
            </div>
            {form.current_status && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Details</label>
                <input value={form.current_status_detail} onChange={e => set("current_status_detail", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. Software Engineer at TCS" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">About me</label>
              <textarea rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone <span className="text-slate-500 font-normal">(members only)</span></label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" />
            </div>
          </div>
        )}

        {tab === "education" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Education Stage</label>
              <div className="grid grid-cols-2 gap-2">
                {(["school", "college", "working", "other"] as EducationStage[]).map(stage => (
                  <button key={stage} type="button" onClick={() => set("education_stage", stage)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      form.education_stage === stage
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "glass border-white/10 text-slate-400 hover:border-cyan-500/30"
                    }`}>
                    {stage === "school" ? "🏫 School (Class 1–12)" : stage === "college" ? "🎓 College / University" : stage === "working" ? "💼 Working Professional" : "✨ Other"}
                  </button>
                ))}
              </div>
            </div>

            {form.education_stage === "school" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Class / Grade</label>
                <select value={form.school_grade} onChange={e => set("school_grade", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
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
                  <select value={form.college_domain} onChange={e => set("college_domain", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
                    <option value="" className="bg-[#030b1a]">Select field…</option>
                    {COLLEGE_DOMAINS.map(d => <option key={d.value} value={d.value} className="bg-[#030b1a]">{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">College / University Name</label>
                  <input value={form.college_name} onChange={e => set("college_name", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. Anna University" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Graduation Year</label>
                  <input type="number" min={2000} max={2035} value={form.graduation_year} onChange={e => set("graduation_year", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. 2026" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Education Details</label>
              <input value={form.education} onChange={e => set("education", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. B.E. Computer Science, Anna University" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Sports & Physical Activities</label>
              <input value={form.sports} onChange={e => set("sports", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. Cricket, Kabaddi, Athletics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Hobbies & Extra Activities</label>
              <input value={form.activities} onChange={e => set("activities", e.target.value)} className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="e.g. Music, Debate Club, Coding" />
            </div>
          </div>
        )}

        {tab === "avatar" && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <AvatarPicker selected={form.avatar_key || null} onSelect={key => set("avatar_key", key)} />
            <div className="border-t border-white/5 pt-4">
              <p className="text-sm font-medium text-slate-300 mb-3">Or upload your own photo</p>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50 border border-cyan-500/30 px-4 py-2 rounded-xl hover:bg-cyan-500/10 transition-colors">
                {uploading ? "Uploading…" : "📸 Upload Photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {user.photo_url && (
                <p className="text-xs text-slate-500 mt-2">Current: custom photo uploaded. Choose an avatar above to switch to space avatar.</p>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl mt-4">{error}</p>}
        {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl mt-4">Profile saved!</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 rounded-xl mt-4">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-widest">My Achievements</h2>
          <div className="space-y-3">
            {achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-2xl">{a.icon ?? ACHIEVEMENT_CATEGORY_ICONS[a.category] ?? "🏅"}</span>
                <div>
                  <p className="text-sm font-medium text-slate-100">{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                </div>
                {a.points_awarded > 0 && (
                  <span className="ml-auto text-xs text-cyan-400 font-medium">+{a.points_awarded} pts</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
