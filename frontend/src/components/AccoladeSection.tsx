"use client";
import { useState, useEffect } from "react";
import { getUserAccolades, giveAccolade, AccoladeStats, AccoladeCategory } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES: { value: AccoladeCategory; emoji: string; label: string }[] = [
  { value: "hardworking", emoji: "💪", label: "Hardworking" },
  { value: "inspiring", emoji: "✨", label: "Inspiring" },
  { value: "helpful", emoji: "🤝", label: "Helpful" },
  { value: "creative", emoji: "🎨", label: "Creative" },
  { value: "leader", emoji: "⭐", label: "Leader" },
  { value: "sporty", emoji: "🏆", label: "Sporty" },
  { value: "academic", emoji: "📚", label: "Academic" },
  { value: "kind", emoji: "❤️", label: "Kind" },
];

export default function AccoladeSection({ userId, isOwnProfile }: { userId: number; isOwnProfile: boolean }) {
  const { token, isApproved } = useAuth();
  const [stats, setStats] = useState<AccoladeStats | null>(null);
  const [showGive, setShowGive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AccoladeCategory | null>(null);
  const [message, setMessage] = useState("");
  const [giving, setGiving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getUserAccolades(userId).then(setStats).catch(() => {});
  }, [userId]);

  const handleGive = async () => {
    if (!token || !selectedCategory) return;
    setGiving(true);
    setError("");
    try {
      await giveAccolade(token, { to_user_id: userId, category: selectedCategory, message: message || undefined });
      const updated = await getUserAccolades(userId);
      setStats(updated);
      setShowGive(false);
      setSelectedCategory(null);
      setMessage("");
      setSuccess("Accolade given! 🎉");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to give accolade");
    } finally {
      setGiving(false);
    }
  };

  if (!stats && !isOwnProfile) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
          Accolades {stats && stats.total > 0 ? `· ${stats.total}` : ""}
        </h2>
        {!isOwnProfile && isApproved && token && (
          <button onClick={() => setShowGive(!showGive)}
            className="text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors">
            {showGive ? "Cancel" : "Give Accolade"}
          </button>
        )}
      </div>

      {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl mb-3">{success}</p>}

      {/* Give accolade form */}
      {showGive && (
        <div className="mb-5 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <p className="text-xs text-slate-400">Choose a category to recognise:</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => setSelectedCategory(cat.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium border transition-all ${
                  selectedCategory === cat.value
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : "glass border-white/10 text-slate-400 hover:border-cyan-500/30"
                }`}>
                <span className="text-lg">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <input value={message} onChange={e => setMessage(e.target.value)}
            className="space-input w-full px-3 py-2 rounded-xl text-sm" maxLength={200}
            placeholder="Add a personal message… (optional)" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleGive} disabled={!selectedCategory || giving}
            className="btn-primary w-full py-2 rounded-xl text-sm disabled:opacity-50">
            {giving ? "Giving…" : "Give Accolade"}
          </button>
        </div>
      )}

      {/* Summary bubbles */}
      {stats && stats.by_category.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.by_category.map(cat => (
            <span key={cat.category}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-sm font-medium text-slate-300">
              <span>{cat.emoji}</span>
              <span>{cat.count}</span>
              <span className="text-slate-500 text-xs capitalize">{cat.category}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4">No accolades yet. Be the first to recognise them!</p>
      )}

      {/* Recent accolades */}
      {stats && stats.recent.length > 0 && (
        <div className="space-y-2 border-t border-white/5 pt-4">
          {stats.recent.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-start gap-2">
              <span className="text-base flex-shrink-0 mt-0.5">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300">
                  <span className="font-medium">{a.from_user.full_name}</span>
                  <span className="text-slate-500"> • {a.category}</span>
                </p>
                {a.message && <p className="text-xs text-slate-500 italic truncate">&quot;{a.message}&quot;</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
