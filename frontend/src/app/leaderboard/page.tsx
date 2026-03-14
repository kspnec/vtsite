"use client";
import { useEffect, useState } from "react";
import { getLeaderboard, LeaderboardEntry } from "@/lib/api";
import { SpaceAvatarDisplay } from "@/components/SpaceAvatar";
import Link from "next/link";

type Category = "all" | "school_primary" | "school_middle" | "school_high" | "school_higher" | "college" | "working";

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "all", label: "All Stars", emoji: "🌟" },
  { value: "school_primary", label: "Primary (1–5)", emoji: "🌱" },
  { value: "school_middle", label: "Middle (6–8)", emoji: "📖" },
  { value: "school_high", label: "High (9–10)", emoji: "🔬" },
  { value: "school_higher", label: "Higher Secondary (11–12)", emoji: "🎯" },
  { value: "college", label: "College", emoji: "🎓" },
  { value: "working", label: "Working", emoji: "💼" },
];

const RANK_STYLES = [
  "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]", // 1st
  "bg-slate-400/20 border-slate-400/40 text-slate-300",                                         // 2nd
  "bg-orange-600/20 border-orange-600/40 text-orange-400",                                      // 3rd
];

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(category === "all" ? undefined : category)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Village Leaderboard</h1>
        <p className="text-slate-400">Celebrating the stars of our village</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              category === cat.value
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border-cyan-500/30"
                : "glass border-white/5 text-slate-400 hover:border-cyan-500/20 hover:text-slate-200"
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading stars…</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🌌</div>
          <p>No members in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const { rank, user } = entry;
            const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : "glass border-white/5";
            const initials = user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
            return (
              <Link key={user.id} href={`/profiles/${user.id}`}
                className={`flex items-center gap-4 rounded-2xl p-4 border transition-all hover:border-cyan-500/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] ${rankStyle}`}>

                {/* Rank */}
                <div className="w-8 text-center">
                  {rank === 1 ? <span className="text-2xl">🥇</span> : rank === 2 ? <span className="text-2xl">🥈</span> : rank === 3 ? <span className="text-2xl">🥉</span> : (
                    <span className="text-sm font-bold text-slate-500">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo_url} alt={user.full_name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                ) : user.avatar_key ? (
                  <SpaceAvatarDisplay avatarKey={user.avatar_key} size={44} />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.education_stage === "school" ? `Class ${user.school_grade}` : user.education_stage === "college" ? `${user.college_domain ?? "College"} — ${user.college_name ?? ""}` : user.current_status_detail ?? user.village_area ?? ""}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-cyan-400">{user.points ?? 0}</p>
                  <p className="text-xs text-slate-500">points</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
