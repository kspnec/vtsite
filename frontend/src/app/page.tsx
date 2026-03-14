import { getProfiles, UserPublic } from "@/lib/api";
import ProfileCard from "@/components/ProfileCard";
import FilterBar from "@/components/FilterBar";

interface SearchParams {
  village_area?: string;
  current_status?: string;
}

export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  let profiles: UserPublic[] = [];
  let error = false;

  try {
    profiles = await getProfiles(params);
  } catch {
    error = true;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-14 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-5xl mb-6 animate-float shadow-[0_0_40px_rgba(52,211,153,0.15)]">
          🌾
        </div>
        <h1 className="text-5xl font-bold text-slate-100 mb-4 leading-tight">
          Our Village,{" "}
          <span className="gradient-text">Our Universe</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
          Every star has a story. Discover the brilliant young talents from our
          village — where they shine and what they&apos;re building today.
        </p>
      </div>

      {/* Filter bar */}
      <FilterBar />

      {/* Stats */}
      {!error && (
        <p className="text-sm text-slate-500 mb-6 text-center">
          {profiles.length} {profiles.length === 1 ? "member" : "members"} found
        </p>
      )}

      {/* Grid */}
      {error ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-4xl mb-3">⚠️</div>
          <p>Could not load profiles. Make sure the backend is running.</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>No profiles found. Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {profiles.map((p, i) => (
            <ProfileCard key={p.id} user={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
