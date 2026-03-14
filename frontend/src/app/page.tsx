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
      <div className="text-center mb-12 animate-fade-in">
        <div className="text-5xl mb-4">🌾</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Our Village,{" "}
          <span className="text-green-600">Our Pride</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Discover the incredible young talents from our village — where they are and what they&apos;re
          doing today.
        </p>
      </div>

      {/* Filter bar */}
      <FilterBar />

      {/* Stats */}
      {!error && (
        <p className="text-sm text-gray-400 mb-6 text-center">
          {profiles.length} {profiles.length === 1 ? "member" : "members"} found
        </p>
      )}

      {/* Grid */}
      {error ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">⚠️</div>
          <p>Could not load profiles. Make sure the backend is running.</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
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
