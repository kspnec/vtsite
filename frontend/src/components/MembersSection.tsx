"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProfiles, UserPublic } from "@/lib/api";
import ProfileCard from "@/components/ProfileCard";
import FilterBar from "@/components/FilterBar";

interface Props {
  searchParams: { village_area?: string; current_status?: string };
}

export default function MembersSection({ searchParams }: Props) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    getProfiles(searchParams)
      .then(setProfiles)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams.village_area, searchParams.current_status]);

  // Not logged in: teaser / CTA
  if (!user && !loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="glass rounded-3xl p-10 text-center border border-cyan-500/10 max-w-2xl mx-auto">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Meet Your Villagers</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Join VTRockers Connect to see profiles of all members — students, farmers,
            professionals — and be part of our growing community.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/signup" className="px-6 py-3 rounded-xl text-sm font-semibold btn-primary">
              Join the Community
            </Link>
            <Link href="/auth/login" className="px-6 py-3 rounded-xl text-sm font-medium glass text-slate-300 border border-white/10 hover:border-cyan-500/20 hover:text-slate-100 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">Our Members</h2>
      </div>

      <FilterBar />

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading members…</div>
      ) : error ? (
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
        <>
          <p className="text-sm text-slate-500 mb-6 text-center">
            {profiles.length} {profiles.length === 1 ? "member" : "members"} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {profiles.map((p, i) => (
              <ProfileCard key={p.id} user={p} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
