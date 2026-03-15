"use client";
import { useEffect, useState } from "react";
import { getEvents, attendEvent, leaveEvent, createEvent, EventOut, EventType } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";

const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  festival: "🎉", sports: "🏏", cultural: "🎭",
  educational: "📚", health: "❤️", community: "🤝", other: "✨",
};
const EVENT_TYPES: EventType[] = ["festival", "sports", "cultural", "educational", "health", "community", "other"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isPast(d: string) {
  return new Date(d) < new Date();
}

export default function EventsPage() {
  const { token, isAdmin, isApproved } = useAuth();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [events, setEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "", description: "", event_type: "festival" as EventType,
    event_date: "", end_date: "", location: "", cover_emoji: "🎉",
  });

  const load = () => {
    setLoading(true);
    const params = filter === "upcoming" ? { upcoming: true } : filter === "past" ? { upcoming: false } : undefined;
    getEvents(params).then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAttend = async (id: number, attending: boolean) => {
    if (!token) return;
    const updated = attending ? await leaveEvent(token, id) : await attendEvent(token, id);
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const created = await createEvent(token, {
        ...newForm,
        end_date: newForm.end_date || undefined,
        description: newForm.description || undefined,
        location: newForm.location || undefined,
      });
      setEvents(prev => [created, ...prev]);
      setShowCreate(false);
      setNewForm({ title: "", description: "", event_type: "festival", event_date: "", end_date: "", location: "", cover_emoji: "🎉" });
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  return (
    <RequireAuth>
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Village Events</h1>
          <p className="text-slate-400 text-sm">Festivals, sports, cultural events and more</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary px-5 py-2 rounded-xl text-sm">
            {showCreate ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isAdmin && (
        <div className="glass rounded-2xl p-6 mb-8 border border-cyan-500/20">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Create Event</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input required value={newForm.title} onChange={e => setNewForm(f => ({...f, title: e.target.value}))}
                  className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="Event title *" />
              </div>
              <div>
                <input value={newForm.cover_emoji} onChange={e => setNewForm(f => ({...f, cover_emoji: e.target.value}))}
                  className="space-input w-full px-4 py-2 rounded-xl text-center text-2xl" placeholder="🎉" maxLength={2} />
              </div>
              <div>
                <select value={newForm.event_type} onChange={e => setNewForm(f => ({...f, event_type: e.target.value as EventType}))}
                  className="space-input w-full px-4 py-2.5 rounded-xl bg-transparent">
                  {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-[#030b1a]">{EVENT_TYPE_EMOJI[t]} {t}</option>)}
                </select>
              </div>
            </div>
            <textarea rows={2} value={newForm.description} onChange={e => setNewForm(f => ({...f, description: e.target.value}))}
              className="space-input w-full px-4 py-2.5 rounded-xl resize-none" placeholder="Description…" />
            <input value={newForm.location} onChange={e => setNewForm(f => ({...f, location: e.target.value}))}
              className="space-input w-full px-4 py-2.5 rounded-xl" placeholder="📍 Location" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Event Date *</label>
                <input required type="date" value={newForm.event_date} onChange={e => setNewForm(f => ({...f, event_date: e.target.value}))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date (optional)</label>
                <input type="date" value={newForm.end_date} onChange={e => setNewForm(f => ({...f, end_date: e.target.value}))}
                  className="space-input w-full px-4 py-2 rounded-xl" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full py-2.5 rounded-xl">
              {creating ? "Creating…" : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["upcoming", "all", "past"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
              filter === f
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border-cyan-500/30"
                : "glass border-white/5 text-slate-400 hover:border-cyan-500/20 hover:text-slate-200"
            }`}>
            {f === "upcoming" ? "⏳ Upcoming" : f === "past" ? "📖 Past" : "📅 All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading events…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">📅</div>
          <p>No {filter !== "all" ? filter : ""} events found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const past = isPast(event.event_date);
            return (
              <div key={event.id} className={`glass rounded-2xl p-5 border transition-all ${past ? "border-white/5 opacity-75" : "border-white/5 hover:border-cyan-500/20"}`}>
                <div className="flex items-start gap-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 text-center glass rounded-xl p-3 min-w-[60px]">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{new Date(event.event_date).toLocaleDateString("en-IN", { month: "short" })}</p>
                    <p className="text-2xl font-bold text-slate-100 leading-none">{new Date(event.event_date).getDate()}</p>
                    <p className="text-xs text-slate-500">{new Date(event.event_date).getFullYear()}</p>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xl">{event.cover_emoji ?? EVENT_TYPE_EMOJI[event.event_type]}</span>
                      <h3 className="font-semibold text-slate-100">{event.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
                        past ? "bg-slate-500/10 text-slate-400 border-slate-500/25" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
                      }`}>
                        {past ? "Past" : "Upcoming"}
                      </span>
                    </div>
                    {event.description && <p className="text-sm text-slate-400 mb-2 line-clamp-2">{event.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {event.location && <span>📍 {event.location}</span>}
                      {event.end_date && event.end_date !== event.event_date && <span>→ {formatDate(event.end_date)}</span>}
                      <span>👥 {event.attendee_count} {event.attendee_count === 1 ? "person" : "people"} going</span>
                    </div>
                  </div>

                  {/* Attend button */}
                  {!past && (isApproved || isAdmin) && (
                    <button
                      onClick={() => handleAttend(event.id, event.is_attending)}
                      className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-lg border font-medium transition-colors ${
                        event.is_attending
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400"
                          : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      }`}>
                      {event.is_attending ? "✓ Going" : "Attend"}
                    </button>
                  )}
                </div>

                {/* Attendee avatars */}
                {event.attendees.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap pl-16">
                    {event.attendees.slice(0, 8).map(a => {
                      const initials = a.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <div key={a.id} title={a.full_name}>
                          {a.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.photo_url} alt={a.full_name} width={24} height={24} className="w-6 h-6 rounded-lg object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold" style={{fontSize:"9px"}}>{initials}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {event.attendee_count > 8 && (
                      <div className="w-6 h-6 rounded-lg glass border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-slate-400" style={{fontSize:"9px"}}>+{event.attendee_count - 8}</span>
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
