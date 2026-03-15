"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminCreateProfile, approveUser, deleteUser, disableUser, enableUser, getPending, getAllUsers, makeAdmin, removeAdmin, rejectUser, CurrentStatus, UserAdminView } from "@/lib/api";

type Tab = "pending" | "all" | "create";

export default function AdminPage() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<UserAdminView[]>([]);
  const [all, setAll] = useState<UserAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserAdminView | null>(null);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    if (!isAdmin) { router.push("/"); return; }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, a] = await Promise.all([getPending(token), getAllUsers(token)]);
      setPending(p);
      setAll(a);
      // Keep drawer in sync if a user is selected
      setSelected(prev => prev ? ([...p, ...a].find(u => u.id === prev.id) ?? null) : null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    await approveUser(token, id);
    fetchData();
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    await rejectUser(token, id);
    fetchData();
  };

  const handleDisable = async (id: number) => {
    if (!token || !confirm("Disable this user? Their profile will be hidden from everyone.")) return;
    await disableUser(token, id);
    fetchData();
  };

  const handleEnable = async (id: number) => {
    if (!token) return;
    await enableUser(token, id);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Permanently delete this user and all their data? This cannot be undone.")) return;
    try {
      await deleteUser(token, id);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleMakeAdmin = async (id: number) => {
    if (!token || !confirm("Make this user an admin?")) return;
    await makeAdmin(token, id);
    fetchData();
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!token || !confirm("Remove admin privileges from this user?")) return;
    await removeAdmin(token, id);
    fetchData();
  };

  const list = tab === "pending" ? pending : all;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
          showApproval={tab === "pending"}
          onApprove={() => handleApprove(selected.id)}
          onReject={() => handleReject(selected.id)}
          onDisable={() => handleDisable(selected.id)}
          onEnable={() => handleEnable(selected.id)}
          onDelete={() => { setSelected(null); handleDelete(selected.id); }}
          onMakeAdmin={() => handleMakeAdmin(selected.id)}
          onRemoveAdmin={() => handleRemoveAdmin(selected.id)}
        />
      )}
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Admin Panel</h1>
      <p className="text-slate-400 mb-8 text-sm">Manage member profiles and approvals</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: "pending", label: `Pending (${pending.length})` },
          { key: "all", label: `All Members (${all.length})` },
          { key: "create", label: "＋ Create Profile" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-500/30"
                : "glass text-slate-400 border border-white/5 hover:border-cyan-500/20 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "create" && token && (
        <CreateProfileForm token={token} onCreated={() => { fetchData(); setTab("all"); }} />
      )}

      {tab !== "create" && (loading ? (
        <div className="text-center py-20 text-slate-500">Loading…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">{tab === "pending" ? "✅" : "👥"}</div>
          <p>{tab === "pending" ? "No pending approvals!" : "No members yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              showApproval={tab === "pending"}
              isSelected={selected?.id === u.id}
              onSelect={() => setSelected(u)}
              onApprove={() => handleApprove(u.id)}
              onReject={() => handleReject(u.id)}
              onDisable={() => handleDisable(u.id)}
              onEnable={() => handleEnable(u.id)}
              onDelete={() => handleDelete(u.id)}
              onMakeAdmin={() => handleMakeAdmin(u.id)}
              onRemoveAdmin={() => handleRemoveAdmin(u.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function UserRow({
  user,
  showApproval,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onDisable,
  onEnable,
  onDelete,
  onMakeAdmin,
  onRemoveAdmin,
}: {
  user: UserAdminView;
  showApproval: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
}) {
  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isDisabled = !user.is_active;
  const isPending = !user.is_approved && user.is_active;
  const isApproved = user.is_approved && user.is_active;

  return (
    <div className={`glass rounded-2xl p-5 flex items-center gap-4 flex-wrap cursor-pointer transition-all ${isDisabled ? "opacity-50" : ""} ${isSelected ? "border-cyan-500/40 bg-cyan-500/5" : "hover:border-white/10"}`}
      onClick={onSelect}
    >
      {/* Avatar */}
      {user.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photo_url} alt={user.full_name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">{initials}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-100">{user.full_name}</p>
          {user.is_admin && (
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full font-medium">Admin</span>
          )}
          {isPending && (
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-full font-medium">Pending</span>
          )}
          {isApproved && (
            <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full font-medium">Approved</span>
          )}
          {isDisabled && (
            <span className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2 py-0.5 rounded-full font-medium">Disabled</span>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate">{user.email}</p>
        {user.village_area && <p className="text-xs text-slate-500">📍 {user.village_area}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
        {showApproval && (
          <>
            <button onClick={onApprove}
              className="text-sm font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-4 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
              Approve
            </button>
            <button onClick={onReject}
              className="text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/25 px-4 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
              Reject
            </button>
          </>
        )}
        {!showApproval && isApproved && !user.is_admin && (
          <button onClick={onMakeAdmin}
            className="text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25 px-4 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors">
            Make Admin
          </button>
        )}
        {!showApproval && user.is_admin && (
          <button onClick={onRemoveAdmin}
            className="text-sm font-medium bg-slate-500/10 text-slate-300 border border-slate-500/25 px-4 py-1.5 rounded-lg hover:bg-slate-500/20 transition-colors">
            Remove Admin
          </button>
        )}
        {/* Disable/Enable for approved active users */}
        {isApproved && !user.is_admin && (
          <button onClick={onDisable}
            className="text-sm font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 px-4 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
            Disable
          </button>
        )}
        {isDisabled && (
          <button onClick={onEnable}
            className="text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 px-4 py-1.5 rounded-lg hover:bg-cyan-500/20 transition-colors">
            Enable
          </button>
        )}
        {/* Delete: always available for pending or disabled users */}
        {(isPending || isDisabled) && (
          <button onClick={onDelete}
            className="text-sm text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── User Detail Drawer ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  job: "Employed", studying: "Studying", business: "Business", farming: "Farming", other: "Other",
};
const STAGE_LABEL: Record<string, string> = {
  school: "School", college: "College", working: "Working", other: "Other",
};

function UserDrawer({
  user, onClose, showApproval,
  onApprove, onReject, onDisable, onEnable, onDelete, onMakeAdmin, onRemoveAdmin,
}: {
  user: UserAdminView;
  onClose: () => void;
  showApproval: boolean;
  onApprove: () => void; onReject: () => void;
  onDisable: () => void; onEnable: () => void; onDelete: () => void;
  onMakeAdmin: () => void; onRemoveAdmin: () => void;
}) {
  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isDisabled = !user.is_active;
  const isPending = !user.is_approved && user.is_active;
  const isApproved = user.is_approved && user.is_active;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#060f22] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#060f22]">
          <span className="text-sm font-semibold text-slate-200">Member Details</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {user.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt={user.full_name} width={64} height={64}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-bold">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-100 text-lg leading-tight">{user.full_name}</p>
              {user.username && <p className="text-xs text-slate-500 mt-0.5">@{user.username}</p>}
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {user.is_admin && <Badge color="purple">Admin</Badge>}
                {isPending && <Badge color="amber">Pending</Badge>}
                {isApproved && <Badge color="emerald">Approved</Badge>}
                {isDisabled && <Badge color="slate">Disabled</Badge>}
              </div>
            </div>
          </div>

          {/* Contact */}
          <Section title="Contact">
            <Row icon="✉️" label="Email" value={user.email} />
            <Row icon="📱" label="Phone" value={user.phone} />
            <Row icon="📍" label="Area" value={user.village_area} />
            {user.date_of_birth && <Row icon="🎂" label="Date of Birth" value={user.date_of_birth} />}
          </Section>

          {/* Status & Education */}
          <Section title="Education & Status">
            {user.current_status && <Row icon="💼" label="Status" value={STATUS_LABEL[user.current_status] ?? user.current_status} />}
            {user.current_status_detail && <Row icon="📝" label="Detail" value={user.current_status_detail} />}
            {user.education_stage && <Row icon="🎓" label="Stage" value={STAGE_LABEL[user.education_stage] ?? user.education_stage} />}
            {user.school_grade && <Row icon="🏫" label="Class" value={`Class ${user.school_grade}`} />}
            {user.college_name && <Row icon="🏛️" label="College" value={user.college_name} />}
            {user.college_domain && <Row icon="📚" label="Field" value={user.college_domain} />}
            {user.graduation_year && <Row icon="🎓" label="Grad Year" value={String(user.graduation_year)} />}
          </Section>

          {/* Activities */}
          {(user.sports || user.activities || user.bio) && (
            <Section title="About">
              {user.bio && <Row icon="✏️" label="Bio" value={user.bio} />}
              {user.sports && <Row icon="⚽" label="Sports" value={user.sports} />}
              {user.activities && <Row icon="⚡" label="Activities" value={user.activities} />}
            </Section>
          )}

          {/* Points & Account */}
          <Section title="Account">
            <Row icon="🏆" label="Points" value={String(user.points ?? 0)} />
            {user.created_at && (
              <Row icon="📅" label="Joined" value={new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
            )}
          </Section>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {showApproval && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onApprove}
                  className="py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors">
                  ✓ Approve
                </button>
                <button onClick={onReject}
                  className="py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-colors">
                  ✗ Reject
                </button>
              </div>
            )}
            {!showApproval && isApproved && !user.is_admin && (
              <button onClick={onMakeAdmin}
                className="w-full py-2 rounded-xl text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25 hover:bg-purple-500/20 transition-colors">
                Make Admin
              </button>
            )}
            {!showApproval && user.is_admin && (
              <button onClick={onRemoveAdmin}
                className="w-full py-2 rounded-xl text-sm font-medium bg-slate-500/10 text-slate-300 border border-slate-500/25 hover:bg-slate-500/20 transition-colors">
                Remove Admin
              </button>
            )}
            {isApproved && !user.is_admin && (
              <button onClick={onDisable}
                className="w-full py-2 rounded-xl text-sm font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition-colors">
                Disable Account
              </button>
            )}
            {isDisabled && (
              <button onClick={onEnable}
                className="w-full py-2 rounded-xl text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors">
                Enable Account
              </button>
            )}
            {(isPending || isDisabled) && (
              <button onClick={onDelete}
                className="w-full py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors">
                Delete Permanently
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Badge({ color, children }: { color: "purple" | "amber" | "emerald" | "slate"; children: React.ReactNode }) {
  const cls = {
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/25",
    amber:  "bg-amber-500/10 text-amber-300 border-amber-500/25",
    emerald:"bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    slate:  "bg-slate-500/10 text-slate-400 border-slate-500/25",
  }[color];
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{children}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="glass rounded-xl divide-y divide-white/5">{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-200 break-words">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CreateProfileForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    village_area: "",
    current_status: "" as CurrentStatus | "",
    bio: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await adminCreateProfile(token, {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        village_area: form.village_area.trim() || undefined,
        current_status: (form.current_status as CurrentStatus) || undefined,
        bio: form.bio.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 max-w-lg">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">Create Profile</h2>
      <p className="text-sm text-slate-400 mb-5">For villagers who cannot register themselves. Profile is pre-approved.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
          <input
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="e.g. Ramu Krishnan"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Email (optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Leave blank to auto-generate"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Village / Area</label>
            <input
              value={form.village_area}
              onChange={(e) => set("village_area", e.target.value)}
              placeholder="e.g. North Street"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Optional"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Current Status</label>
          <select
            value={form.current_status}
            onChange={(e) => set("current_status", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">— select —</option>
            <option value="job">Employed</option>
            <option value="studying">Studying</option>
            <option value="business">Business</option>
            <option value="farming">Farming</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={3}
            placeholder="Brief description…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
