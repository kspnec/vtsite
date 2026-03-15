"use client";
import { useEffect, useState } from "react";
import { getInitiatives, getProfiles, joinInitiative, leaveInitiative, createInitiative, deleteInitiative, updateInitiative, InitiativeOut, InitiativeStatus, InitiativeCategory, UserPublic } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
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

export default function InitiativesPage() {
  const { token, isAdmin, isApproved } = useAuth();
  const [initiatives, setInitiatives] = useState<InitiativeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<InitiativeStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState<UserPublic[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [newForm, setNewForm] = useState({
    title: "", description: "", status: "planned" as InitiativeStatus,
    category: "education" as InitiativeCategory, start_date: "", end_date: "",
    lead_user_id: 0,
  });

  const load = () => {
    setLoading(true);
    getInitiatives(filterStatus ? { status: filterStatus } : undefined)
      .then(setInitiatives).catch(() => setInitiatives([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch members when create form opens (for PIC picker)
  useEffect(() => {
    if (showCreate && members.length === 0) {
      getProfiles().then(setMembers).catch(() => {});
    }
  }, [showCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async (id: number) => {
    if (!token) return;
    const updated = await joinInitiative(token, id);
    setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
  };

  const handleLeave = async (id: number) => {
    if (!token) return;
    const updated = await leaveInitiative(token, id);
    setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this initiative? This cannot be undone.")) return;
    await deleteInitiative(token, id);
    setInitiatives(prev => prev.filter(i => i.id !== id));
  };

  const handleStatusChange = async (id: number, status: InitiativeStatus) => {
    if (!token) return;
    const updated = await updateInitiative(token, id, { status });
    setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newForm.lead_user_id) return;
    setCreating(true);
    try {
      const created = await createInitiative(token, {
        title: newForm.title,
        description: newForm.description || undefined,
        status: newForm.status,
        category: newForm.category,
        lead_user_id: newForm.lead_user_id,
        start_date: newForm.start_date || undefined,
        end_date: newForm.end_date || undefined,
      });
      setInitiatives(prev => [created, ...prev]);
      setShowCreate(false);
      setNewForm({ title: "", description: "", status: "planned", category: "education", start_date: "", end_date: "", lead_user_id: 0 });
      setMemberSearch("");
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const selectedLead = members.find(m => m.id === newForm.lead_user_id);
  const filteredMembers = memberSearch.trim()
    ? members.filter(m => m.full_name.toLowerCase().includes(memberSearch.toLowerCase()))
    : members;

  return (
    <RequireAuth>
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Village Initiatives</h1>
          <p className="text-slate-400 text-sm">Development projects by our village youngsters</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="btn-primary px-5 py-2 rounded-xl text-sm">
            {showCreate ? "Cancel" : "+ New Initiative"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isAdmin && (
        <div className="glass rounded-2xl p-6 mb-8 border border-cyan-500/20">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Create Initiative</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input required value={newForm.title} onChange={e => setNewForm(f => ({...f, title: e.target.value}))}
              className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Initiative title *" />
            <textarea rows={3} value={newForm.description} onChange={e => setNewForm(f => ({...f, description: e.target.value}))}
              className="space-input w-full px-4 py-2.5 rounded-xl resize-none" placeholder="Description…" />

            {/* PIC / Leader — required */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                👤 Lead / PIC <span className="text-red-400">*</span>
                <span className="text-slate-600 font-normal ml-1">(Person in Charge — drives this initiative)</span>
              </label>
              {selectedLead ? (
                <div className="flex items-center justify-between px-4 py-2.5 space-input rounded-xl">
                  <span className="text-sm text-slate-200">{selectedLead.full_name}</span>
                  <button type="button" onClick={() => { setNewForm(f => ({...f, lead_user_id: 0})); setMemberSearch(""); }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-2">✕ Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="space-input w-full px-4 py-2.5 rounded-xl"
                    placeholder="Search member name…"
                  />
                  {memberSearch && filteredMembers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 glass rounded-xl border border-white/10 shadow-xl max-h-48 overflow-y-auto">
                      {filteredMembers.slice(0, 8).map(m => (
                        <button key={m.id} type="button"
                          onClick={() => { setNewForm(f => ({...f, lead_user_id: m.id})); setMemberSearch(""); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{m.full_name[0]}</span>
                          </div>
                          {m.full_name}
                          {m.village_area && <span className="text-xs text-slate-500">· {m.village_area}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {memberSearch && filteredMembers.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 glass rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-500">
                      No members found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={newForm.category} onChange={e => setNewForm(f => ({...f, category: e.target.value as InitiativeCategory}))}
                className="space-input px-4 py-2.5 rounded-xl bg-transparent">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#030b1a]">{CATEGORY_EMOJI[c]} {c}</option>)}
              </select>
              <select value={newForm.status} onChange={e => setNewForm(f => ({...f, status: e.target.value as InitiativeStatus}))}
                className="space-input px-4 py-2.5 rounded-xl bg-transparent">
                <option value="planned" className="bg-[#030b1a]">Planned</option>
                <option value="ongoing" className="bg-[#030b1a]">Ongoing</option>
                <option value="completed" className="bg-[#030b1a]">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input type="date" value={newForm.start_date} onChange={e => setNewForm(f => ({...f, start_date: e.target.value}))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input type="date" value={newForm.end_date} onChange={e => setNewForm(f => ({...f, end_date: e.target.value}))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
            </div>
            <button type="submit" disabled={creating || !newForm.lead_user_id}
              className="btn-primary w-full py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? "Creating…" : "Create Initiative"}
            </button>
            {!newForm.lead_user_id && (
              <p className="text-xs text-amber-400 text-center">Select a Lead / PIC to create the initiative</p>
            )}
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["", "ongoing", "planned", "completed"] as Array<InitiativeStatus | "">).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filterStatus === s
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border-cyan-500/30"
                : "glass border-white/5 text-slate-400 hover:border-cyan-500/20 hover:text-slate-200"
            }`}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading…</div>
      ) : initiatives.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🌱</div>
          <p>No initiatives yet. Be the first to start something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initiatives.map(initiative => {
            const statusStyle = STATUS_STYLES[initiative.status];
            return (
              <div key={initiative.id} className="glass rounded-2xl p-5 hover:border-cyan-500/20 border border-white/5 transition-all group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{CATEGORY_EMOJI[initiative.category]}</span>
                    <Link href={`/initiatives/${initiative.id}`} className="font-semibold text-slate-100 hover:text-cyan-400 transition-colors">
                      {initiative.title}
                    </Link>
                    {isAdmin ? (
                      <select
                        value={initiative.status}
                        onChange={e => handleStatusChange(initiative.id, e.target.value as InitiativeStatus)}
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium cursor-pointer bg-transparent appearance-none ${statusStyle.color}`}
                        title="Change status"
                      >
                        <option value="planned" className="bg-[#030b1a] text-slate-300">Planned</option>
                        <option value="ongoing" className="bg-[#030b1a] text-slate-300">Ongoing</option>
                        <option value="completed" className="bg-[#030b1a] text-slate-300">Completed</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {(isApproved || isAdmin) && (
                      initiative.is_participant ? (
                        <button onClick={() => handleLeave(initiative.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                          Leave
                        </button>
                      ) : (
                        <button onClick={() => handleJoin(initiative.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                          + Join
                        </button>
                      )
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(initiative.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete initiative">
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {initiative.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{initiative.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  {initiative.lead_user ? (
                    <span>👤 Led by <Link href={`/profiles/${initiative.lead_user.id}`} className="text-cyan-400 hover:text-cyan-300">{initiative.lead_user.full_name}</Link></span>
                  ) : isAdmin && (
                    <span className="text-amber-400">⚠️ No PIC</span>
                  )}
                  {initiative.start_date && <span>📅 {initiative.start_date}</span>}
                  {initiative.end_date && <span>🏁 {initiative.end_date}</span>}
                  <span>👥 {initiative.participant_count} participant{initiative.participant_count !== 1 ? "s" : ""}</span>
                </div>

                {initiative.participants.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {initiative.participants.slice(0, 8).map(p => {
                      const initials = p.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <Link key={p.id} href={`/profiles/${p.id}`} title={p.full_name}>
                          {p.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photo_url} alt={p.full_name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{initials}</span>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                    {initiative.participant_count > 8 && (
                      <div className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-slate-400">+{initiative.participant_count - 8}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </RequireAuth>
  );
}
