import { getProfile, AchievementOut } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpaceAvatarDisplay } from "@/components/SpaceAvatar";

const STATUS_LABELS: Record<string, string> = {
  job: "Working",
  studying: "Studying",
  business: "Business",
  farming: "Farming",
  other: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  job:      "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25",
  studying: "bg-purple-500/10 text-purple-300 border border-purple-500/25",
  business: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  farming:  "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  other:    "bg-slate-500/10 text-slate-400 border border-slate-500/25",
};

const COLLEGE_DOMAIN_LABELS: Record<string, string> = {
  engineering: "Engineering / Technology",
  medicine: "Medicine / Health Sciences",
  arts: "Arts & Humanities",
  science: "Pure Sciences",
  commerce: "Commerce / Business",
  law: "Law",
  other: "Other",
};

const ACHIEVEMENT_CATEGORY_ICONS: Record<string, string> = {
  academic: "📚",
  sports: "🏆",
  cultural: "🎭",
  community: "🤝",
  leadership: "⭐",
};

async function getAchievements(userId: number): Promise<AchievementOut[]> {
  const BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${BASE_URL}/profiles/${userId}/achievements`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let profile;
  try {
    profile = await getProfile(Number(id));
  } catch {
    notFound();
  }

  const achievements = await getAchievements(Number(id));

  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <Link href="/" className="text-sm text-slate-500 hover:text-cyan-400 flex items-center gap-1 mb-8 transition-colors">
        ← Back to all profiles
      </Link>

      <div className="glass rounded-3xl overflow-hidden">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-cyan-900/80 via-purple-900/60 to-emerald-900/80 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>

        <div className="px-8 pb-8 -mt-12">
          {/* Avatar */}
          <div className="mb-4">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
              />
            ) : profile.avatar_key ? (
              <SpaceAvatarDisplay avatarKey={profile.avatar_key} size={96} name={profile.full_name} />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-lg">
                <span className="text-white font-bold text-3xl">{initials}</span>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{profile.full_name}</h1>
              {profile.village_area && (
                <p className="text-slate-400 flex items-center gap-1 mt-1">
                  <span>📍</span> {profile.village_area}
                </p>
              )}
            </div>
            {profile.points ? (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 rounded-xl">
                <span className="text-cyan-400">⭐</span>
                <span className="text-lg font-bold text-cyan-400">{profile.points}</span>
                <span className="text-xs text-slate-500">points</span>
              </div>
            ) : null}
          </div>

          {profile.current_status && (
            <span
              className={`inline-block mt-3 text-sm font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[profile.current_status]}`}
            >
              {STATUS_LABELS[profile.current_status]}
              {profile.current_status_detail ? ` · ${profile.current_status_detail}` : ""}
            </span>
          )}

          <div className="mt-6 space-y-4 divide-y divide-white/5">
            {/* Education details */}
            {profile.education_stage && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Education</p>
                <div className="space-y-1.5">
                  {profile.education_stage === "school" && (
                    <p className="text-slate-300">
                      🏫 School{profile.school_grade ? ` — Class ${profile.school_grade}` : ""}
                    </p>
                  )}
                  {profile.education_stage === "college" && (
                    <>
                      <p className="text-slate-300">
                        🎓 College{profile.college_domain ? ` — ${COLLEGE_DOMAIN_LABELS[profile.college_domain] ?? profile.college_domain}` : ""}
                      </p>
                      {profile.college_name && (
                        <p className="text-slate-400 text-sm">{profile.college_name}{profile.graduation_year ? ` · ${profile.graduation_year}` : ""}</p>
                      )}
                    </>
                  )}
                  {profile.education_stage === "working" && (
                    <p className="text-slate-300">💼 Working Professional</p>
                  )}
                  {profile.education && (
                    <p className="text-slate-400 text-sm">{profile.education}</p>
                  )}
                </div>
              </div>
            )}

            {!profile.education_stage && profile.education && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Education</p>
                <p className="text-slate-300 leading-relaxed">{profile.education}</p>
              </div>
            )}

            {/* Sports & Activities */}
            {(profile.sports || profile.activities) && (
              <div className="pt-4">
                {profile.sports && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Sports</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.sports.split(",").map(s => s.trim()).filter(Boolean).map((sport, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.activities && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Activities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.activities.split(",").map(a => a.trim()).filter(Boolean).map((activity, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile.bio && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">About</p>
                <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-xs text-slate-500">
                Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-widest">Achievements</h2>
          <div className="space-y-3">
            {achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-2xl">{a.icon ?? ACHIEVEMENT_CATEGORY_ICONS[a.category] ?? "🏅"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                </div>
                {a.points_awarded > 0 && (
                  <span className="text-xs text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                    +{a.points_awarded} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
