"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-cyan-500/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-lg gradient-text group-hover:opacity-90 transition-opacity">
            Village Connect
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors border border-transparent hover:border-amber-500/20 hidden sm:inline-flex"
          >
            🏆 Leaderboard
          </Link>
          <Link
            href="/initiatives"
            className="text-sm font-medium text-slate-300 hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20 hidden sm:inline-flex"
          >
            🌱 Initiatives
          </Link>
          {user ? (
            <>
              {!user.is_approved && (
                <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full font-medium hidden sm:inline">
                  Pending Approval
                </span>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-purple-300 hover:text-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors border border-transparent hover:border-purple-500/20"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-300 hover:text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium text-white px-4 py-2 rounded-lg btn-primary"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
