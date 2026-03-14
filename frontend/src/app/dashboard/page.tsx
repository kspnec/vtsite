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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-gray-500 mb-4 text-sm">
        {isApproved ? "Your profile is live and visible to everyone." : "⏳ Pending admin approval — your profile will go public once approved."}
      </p>
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-sm text-amber-800">
          While you wait, complete your profile and add a photo — it will be ready the moment you&apos;re approved!
        </div>
      )}

      {/* Photo */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6 flex items-center gap-5">
        <div className="relative">
          {user.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt={user.full_name} width={72} height={72} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.full_name}</p>
          <p className="text-sm text-gray-500 mb-2">{user.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Village / Area</label>
            <input value={form.village_area} onChange={(e) => set("village_area", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currently</label>
            <select value={form.current_status} onChange={(e) => set("current_status", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
              <option value="">Select…</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {form.current_status && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Details</label>
              <input value={form.current_status_detail} onChange={(e) => set("current_status_detail", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="e.g. Software Engineer at TCS" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Education</label>
            <input value={form.education} onChange={(e) => set("education", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About me</label>
            <textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(members only)</span></label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl">Profile saved successfully!</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
