import Link from "next/link";
import { UserPublic } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  job: "Working",
  studying: "Studying",
  business: "Business",
  farming: "Farming",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  job: "bg-blue-100 text-blue-700",
  studying: "bg-purple-100 text-purple-700",
  business: "bg-amber-100 text-amber-700",
  farming: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

interface Props {
  user: UserPublic;
  index?: number;
}

export default function ProfileCard({ user, index = 0 }: Props) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bgColors = [
    "from-green-400 to-emerald-600",
    "from-blue-400 to-indigo-600",
    "from-purple-400 to-violet-600",
    "from-amber-400 to-orange-600",
    "from-rose-400 to-pink-600",
    "from-teal-400 to-cyan-600",
  ];
  const gradient = bgColors[index % bgColors.length];

  return (
    <Link
      href={`/profiles/${user.id}`}
      className="block bg-white rounded-2xl overflow-hidden card-hover animate-fade-in border border-gray-100"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top banner */}
      <div className={`h-20 bg-gradient-to-r ${gradient} opacity-80`} />

      {/* Avatar */}
      <div className="px-5 pb-5 -mt-10">
        <div className="mb-3">
          {user.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photo_url}
              alt={user.full_name}
              width={72}
              height={72}
              className="w-18 h-18 rounded-2xl object-cover border-4 border-white shadow-md"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center border-4 border-white shadow-md`}
            >
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{user.full_name}</h3>

        {user.village_area && (
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <span>📍</span> {user.village_area}
          </p>
        )}

        {user.current_status && (
          <span
            className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[user.current_status]}`}
          >
            {STATUS_LABELS[user.current_status]}
            {user.current_status_detail ? ` · ${user.current_status_detail}` : ""}
          </span>
        )}

        {user.bio && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
