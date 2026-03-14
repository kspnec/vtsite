import { getProfile } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let profile;
  try {
    profile = await getProfile(Number(id));
  } catch {
    notFound();
  }

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
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-lg">
                <span className="text-white font-bold text-3xl">{initials}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-100">{profile.full_name}</h1>

          {profile.village_area && (
            <p className="text-slate-400 flex items-center gap-1 mt-1">
              <span>📍</span> {profile.village_area}
            </p>
          )}

          {profile.current_status && (
            <span
              className={`inline-block mt-3 text-sm font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[profile.current_status]}`}
            >
              {STATUS_LABELS[profile.current_status]}
              {profile.current_status_detail ? ` · ${profile.current_status_detail}` : ""}
            </span>
          )}

          <div className="mt-6 space-y-4 divide-y divide-white/5">
            {profile.education && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Education</p>
                <p className="text-slate-300 leading-relaxed">{profile.education}</p>
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
    </div>
  );
}
