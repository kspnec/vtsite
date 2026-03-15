"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getInitiative, getProfiles, joinInitiative, leaveInitiative, updateInitiative, deleteInitiative,
  getProgressUpdates, addProgressUpdate, deleteProgressUpdate,
  InitiativeOut, InitiativeStatus, InitiativeCategory, ProgressUpdateOut, UserPublic,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";

const STATUS_STYLES: Record<InitiativeStatus, { label: string; color: string }> = {
  planned: { label: "Planned", color: "bg-slate-500/10 text-slate-400 border-slate-500/25" },
  ongoing: { label: "Ongoing", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
};

const CATEGORY_EMOJI: Record<InitiativeCategory, string> = {
  education: "📚", sports: "⚽", environment: "🌿", infrastructure: "🏗️",
  arts: "🎨", health: "❤️", technology: "💻", other: "✨",
};

const CATEGORIES: InitiativeCategory[] = ["education", "sports", "environment", "infrastructure", "arts", "health", "technology", "other"];

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ name, photoUrl, size = 8 }: { name: string; photoUrl?: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const sz = `w-${size} h-${size}`;
  if (photoUrl) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={name} className={`${sz} rounded-lg object-cover`} />
  );
  return (
    <div className={`${sz} rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const initiativeId = parseInt(idStr, 10);
  const router = useRouter();
  const { token, isAdmin, isApproved } = useAuth();

  const [initiative, setInitiative] = useState<InitiativeOut | null>(null);
  const [progress, setProgress] = useState<ProgressUpdateOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", description: "", status: "planned" as InitiativeStatus,
    category: "education" as InitiativeCategory, start_date: "", end_date: "",
    lead_user_id: 0,
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<UserPublic[]>([]);
  const [leadSearch, setLeadSearch] = useState("");

  // Progress update state
  const [newUpdate, setNewUpdate] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getInitiative(initiativeId),
      getProgressUpdates(initiativeId),
    ]).then(([ini, prog]) => {
      setInitiative(ini);
      setProgress(prog);
      setEditForm({
        title: ini.title,
        description: ini.description ?? "",
        status: ini.status,
        category: ini.category,
        start_date: ini.start_date ?? "",
        end_date: ini.end_date ?? "",
        lead_user_id: ini.lead_user?.id ?? 0,
      });
    }).catch(() => setNotFound(true))
    .finally(() => setLoading(false));
  }, [initiativeId]);

  const handleJoin = async () => {
    if (!token || !initiative) return;
    const updated = await joinInitiative(token, initiative.id);
    setInitiative(updated);
  };

  const handleLeave = async () => {
    if (!token || !initiative) return;
    const updated = await leaveInitiative(token, initiative.id);
    setInitiative(updated);
  };

  const handleDelete = async () => {
    if (!token || !initiative || !confirm("Delete this initiative? This cannot be undone.")) return;
    await deleteInitiative(token, initiative.id);
    router.push("/initiatives");
  };

  // Fetch members list when edit form opens
  useEffect(() => {
    if (editing && members.length === 0) {
      getProfiles().then(setMembers).catch(() => {});
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !initiative) return;
    setSaving(true);
    try {
      const updated = await updateInitiative(token, initiative.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        status: editForm.status,
        category: editForm.category,
        lead_user_id: editForm.lead_user_id || undefined,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined,
      });
      setInitiative(updated);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const editLeadMember = members.find(m => m.id === editForm.lead_user_id);
  const filteredLeadMembers = leadSearch.trim()
    ? members.filter(m => m.full_name.toLowerCase().includes(leadSearch.toLowerCase()))
    : members;

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newUpdate.trim()) return;
    setAddingUpdate(true);
    try {
      const update = await addProgressUpdate(token, initiativeId, newUpdate.trim());
      setProgress(prev => [update, ...prev]);
      setNewUpdate("");
    } finally { setAddingUpdate(false); }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!token) return;
    await deleteProgressUpdate(token, initiativeId, updateId);
    setProgress(prev => prev.filter(u => u.id !== updateId));
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>
  );

  if (notFound || !initiative) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-slate-400">Initiative not found.</p>
      <Link href="/initiatives" className="text-cyan-400 hover:text-cyan-300 text-sm mt-4 inline-block">← Back to initiatives</Link>
    </div>
  );

  const statusStyle = STATUS_STYLES[initiative.status];

  return (
    <RequireAuth>
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      {/* Back */}
      <Link href="/initiatives" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
        ← Back to Initiatives
      </Link>

      {/* Header card */}
      <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <input
              required
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="space-input w-full px-4 py-2.5 rounded-xl text-lg font-semibold"
              placeholder="Initiative title"
            />
            <textarea
              rows={4}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              className="space-input w-full px-4 py-2.5 rounded-xl resize-none"
              placeholder="Description…"
            />
            {/* PIC / Leader picker */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                👤 Lead / PIC
              </label>
              {editLeadMember ? (
                <div className="flex items-center justify-between px-4 py-2.5 space-input rounded-xl">
                  <span className="text-sm text-slate-200">{editLeadMember.full_name}</span>
                  <button type="button" onClick={() => { setEditForm(f => ({...f, lead_user_id: 0})); setLeadSearch(""); }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-2">✕ Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={leadSearch}
                    onChange={e => setLeadSearch(e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="Search and assign a lead…"
                  />
                  {leadSearch && filteredLeadMembers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 glass rounded-xl border border-white/10 shadow-xl max-h-48 overflow-y-auto">
                      {filteredLeadMembers.slice(0, 8).map(m => (
                        <button key={m.id} type="button"
                          onClick={() => { setEditForm(f => ({...f, lead_user_id: m.id})); setLeadSearch(""); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors">
                          {m.full_name}
                          {m.village_area && <span className="text-xs text-slate-500 ml-2">· {m.village_area}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={editForm.category}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value as InitiativeCategory }))}
                className="space-input px-4 py-2.5 rounded-xl bg-transparent"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-[#030b1a]">{CATEGORY_EMOJI[c]} {c}</option>
                ))}
              </select>
              <select
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value as InitiativeStatus }))}
                className="space-input px-4 py-2.5 rounded-xl bg-transparent"
              >
                <option value="planned" className="bg-[#030b1a]">Planned</option>
                <option value="ongoing" className="bg-[#030b1a]">Ongoing</option>
                <option value="completed" className="bg-[#030b1a]">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input type="date" value={editForm.start_date}
                  onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input type="date" value={editForm.end_date}
                  onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="px-6 py-2.5 rounded-xl text-sm glass border border-white/10 text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl">{CATEGORY_EMOJI[initiative.category]}</span>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">{initiative.title}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusStyle.color}`}>
                      {statusStyle.label}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{initiative.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button onClick={() => setEditing(true)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors">
                      Edit
                    </button>
                    <button onClick={handleDelete}
                      className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete initiative">
                      🗑
                    </button>
                  </>
                )}
                {(isApproved || isAdmin) && (
                  initiative.is_participant ? (
                    <button onClick={handleLeave}
                      className="text-xs px-4 py-1.5 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                      Leave
                    </button>
                  ) : (
                    <button onClick={handleJoin}
                      className="btn-primary text-xs px-4 py-1.5 rounded-lg">
                      + Join
                    </button>
                  )
                )}
              </div>
            </div>

            {initiative.description && (
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{initiative.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-3 border-t border-white/5">
              {initiative.lead_user ? (
                <span className="flex items-center gap-1.5">
                  👤 Led by{" "}
                  <Link href={`/profiles/${initiative.lead_user.id}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                    {initiative.lead_user.full_name}
                  </Link>
                </span>
              ) : isAdmin && (
                <span className="text-amber-400 font-medium">⚠️ No PIC assigned — edit to add a leader</span>
              )}
              {initiative.start_date && <span>📅 {initiative.start_date}</span>}
              {initiative.end_date && <span>🏁 {initiative.end_date}</span>}
              {initiative.created_at && (
                <span>🗓 Created {new Date(initiative.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Participants */}
      <div className="glass rounded-2xl p-5 mb-6 border border-white/5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Participants · {initiative.participant_count}
        </h2>
        {initiative.participants.length === 0 ? (
          <p className="text-sm text-slate-500">No participants yet. Be the first to join!</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {initiative.participants.map(p => (
              <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/5 hover:border-cyan-500/20 transition-colors">
                <Avatar name={p.full_name} photoUrl={p.photo_url} size={6} />
                <span className="text-xs text-slate-300 font-medium">{p.full_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Progress Updates */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Progress Updates · {progress.length}
        </h2>

        {/* Add update form — admin only */}
        {isAdmin && (
          <form onSubmit={handleAddUpdate} className="mb-6 flex gap-3">
            <input
              value={newUpdate}
              onChange={e => setNewUpdate(e.target.value)}
              className="space-input flex-1 px-4 py-2.5 rounded-xl text-sm"
              placeholder="Post a progress update…"
            />
            <button type="submit" disabled={addingUpdate || !newUpdate.trim()}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm flex-shrink-0">
              {addingUpdate ? "Posting…" : "Post"}
            </button>
          </form>
        )}

        {progress.length === 0 ? (
          <p className="text-sm text-slate-500">No updates yet.{isAdmin ? " Post the first one above." : ""}</p>
        ) : (
          <div className="space-y-4">
            {progress.map(u => (
              <div key={u.id} className="flex gap-3 group">
                {u.author && (
                  <Link href={`/profiles/${u.author.id}`} className="flex-shrink-0 mt-0.5">
                    <Avatar name={u.author.full_name} photoUrl={u.author.photo_url} size={8} />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {u.author && (
                        <Link href={`/profiles/${u.author.id}`} className="text-sm font-medium text-slate-200 hover:text-cyan-400 transition-colors">
                          {u.author.full_name}
                        </Link>
                      )}
                      <span className="text-xs text-slate-600">{timeAgo(u.created_at)}</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteUpdate(u.id)}
                        className="text-xs text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        title="Delete update">
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{u.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
