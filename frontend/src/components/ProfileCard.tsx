import Link from "next/link";
import { UserPublic } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  job: "Working", studying: "Studying", business: "Business",
  farming: "Farming", other: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  job:      "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25",
  studying: "bg-purple-500/10 text-purple-300 border border-purple-500/25",
  business: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  farming:  "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  other:    "bg-slate-500/10 text-slate-400 border border-slate-500/25",
};
const BANNER_GRADIENTS = [
  "from-cyan-900/80 via-blue-900/60 to-purple-900/80",
  "from-purple-900/80 via-violet-900/60 to-pink-900/80",
  "from-blue-900/80 via-cyan-900/60 to-teal-900/80",
  "from-amber-900/80 via-orange-900/60 to-red-900/80",
  "from-emerald-900/80 via-teal-900/60 to-cyan-900/80",
  "from-pink-900/80 via-purple-900/60 to-violet-900/80",
];
const AVATAR_GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-purple-500 to-violet-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-purple-600",
];

interface Props { user: UserPublic; index?: number; }

export default function ProfileCard({ user, index = 0 }: Props) {
  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const banner = BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];
  const avatar = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <Link
      href={`/profiles/${user.id}`}
      className="block glass rounded-2xl overflow-hidden card-hover animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Cosmic banner */}
      <div className={`h-20 bg-gradient-to-r ${banner} relative`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:24px_24px]" />
      </div>

      {/* Content */}
      <div className="px-5 pb-5 -mt-10">
        <div className="mb-3">
          {user.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photo_url}
              alt={user.full_name}
              width={72} height={72}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
              loading="lazy"
            />
          ) : (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatar} flex items-center justify-center border-2 border-white/10 shadow-lg`}>
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-slate-100 text-base leading-tight">{user.full_name}</h3>

        {user.village_area && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>📍</span> {user.village_area}
          </p>
        )}

        {user.current_status && (
          <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[user.current_status]}`}>
            {STATUS_LABELS[user.current_status]}
            {user.current_status_detail ? ` · ${user.current_status_detail}` : ""}
          </span>
        )}

        {user.bio && (
          <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
