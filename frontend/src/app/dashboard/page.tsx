"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, uploadPhoto, UserAdminView, CurrentStatus } from "@/lib/api";

const STATUSES: { value: CurrentStatus; label: string }[] = [
  { value: "job", label: "Working / Job" },
  { value: "studying", label: "Studying" },
  { value: "business", label: "Business" },
  { value: "farming", label: "Farming" },
  { value: "other", label: "Other" },
];

export default function DashboardPage() {
  const { user, token, setSession, isApproved } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    village_area: "",
    current_status: "" as CurrentStatus | "",
    current_status_detail: "",
    education: "",
    bio: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    if (user) {
      setForm({
        full_name: user.full_name ?? "",
        village_area: user.village_area ?? "",
        current_status: user.current_status ?? "",
        current_status_detail: user.current_status_detail ?? "",
        education: user.education ?? "",
        bio: user.bio ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user, token, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(token, {
        ...form,
        current_status: (form.current_status as CurrentStatus) || undefined,
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

  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">My Profile</h1>
      <p className="text-slate-400 mb-4 text-sm">
        {isApproved ? "Your profile is live and visible to everyone." : "⏳ Pending admin approval — your profile will go public once approved."}
      </p>
      {!isApproved && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-8 text-sm text-amber-300">
          While you wait, complete your profile and add a photo — it will be ready the moment you&apos;re approved!
        </div>
      )}

      {/* Photo */}
      <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          {user.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt={user.full_name} width={72} height={72} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-100">{user.full_name}</p>
          <p className="text-sm text-slate-400 mb-2">{user.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Village / Area</label>
            <input value={form.village_area} onChange={(e) => set("village_area", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Currently</label>
            <select value={form.current_status} onChange={(e) => set("current_status", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
              <option value="" className="bg-[#030b1a]">Select…</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value} className="bg-[#030b1a]">{s.label}</option>)}
            </select>
          </div>
          {form.current_status && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Details</label>
              <input value={form.current_status_detail} onChange={(e) => set("current_status_detail", e.target.value)}
                className="space-input w-full px-4 py-2.5 rounded-xl"
                placeholder="e.g. Software Engineer at TCS" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Education</label>
            <input value={form.education} onChange={(e) => set("education", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">About me</label>
            <textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone <span className="text-slate-500 font-normal">(members only)</span></label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className="space-input w-full px-4 py-2.5 rounded-xl" />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
          {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">Profile saved successfully!</p>}

          <button type="submit" disabled={saving}
            className="btn-primary w-full py-2.5 rounded-xl">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
