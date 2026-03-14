import { getProfile } from "@/lib/api";
import Image from "next/image";
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
  job: "bg-blue-100 text-blue-700",
  studying: "bg-purple-100 text-purple-700",
  business: "bg-amber-100 text-amber-700",
  farming: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
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
      <Link href="/" className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1 mb-8">
        ← Back to all profiles
      </Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-600" />

        <div className="px-8 pb-8 -mt-12">
          {/* Avatar */}
          <div className="mb-4">
            {profile.photo_url ? (
              <Image
                src={profile.photo_url}
                alt={profile.full_name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-white font-bold text-3xl">{initials}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>

          {profile.village_area && (
            <p className="text-gray-500 flex items-center gap-1 mt-1">
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

          <div className="mt-6 space-y-4 divide-y divide-gray-100">
            {profile.education && (
              <div className="pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Education</p>
                <p className="text-gray-700">{profile.education}</p>
              </div>
            )}
            {profile.bio && (
              <div className="pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">About</p>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            <div className="pt-4">
              <p className="text-xs text-gray-400">
                Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
