"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    router.push("/");
  };

  const close = () => setMenuOpen(false);

  const initials = user
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-500/10 bg-[#030b1a]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Mobile hamburger (left side) */}
        <button
          className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" onClick={close}>
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-lg gradient-text group-hover:opacity-90 transition-opacity">
            VTRockers Connect
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/leaderboard" className="text-sm font-medium text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors border border-transparent hover:border-amber-500/20">
            🏆 Leaderboard
          </Link>
          <Link href="/initiatives" className="text-sm font-medium text-slate-300 hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20">
            🌱 Initiatives
          </Link>
          <Link href="/events" className="text-sm font-medium text-slate-300 hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors border border-transparent hover:border-purple-500/20">
            📅 Events
          </Link>

          {user && <NotificationBell />}

          {user ? (
            /* Profile avatar + dropdown */
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                aria-label="Profile menu"
              >
                {/* Avatar */}
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photo_url}
                    alt={user.full_name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-cyan-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/30">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200 max-w-[100px] truncate">
                  {user.full_name.split(" ")[0]}
                </span>
                {/* Chevron */}
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl border border-white/10 shadow-2xl shadow-black/40 py-2 z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-slate-100 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {!user.is_approved && (
                      <span className="mt-1 inline-block text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors"
                    >
                      <span>👤</span> My Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-colors"
                      >
                        <span>🛡️</span> Admin Panel
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-slate-300 hover:text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20">
                Login
              </Link>
              <Link href="/auth/signup" className="text-sm font-medium text-white px-4 py-2 rounded-lg btn-primary">
                Join
              </Link>
            </>
          )}
        </div>

      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden glass border-t border-cyan-500/10 px-4 py-3 flex flex-col gap-1">
          <Link href="/leaderboard" onClick={close} className="text-sm font-medium text-slate-300 hover:text-amber-300 px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-colors">
            🏆 Leaderboard
          </Link>
          <Link href="/initiatives" onClick={close} className="text-sm font-medium text-slate-300 hover:text-emerald-300 px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors">
            🌱 Initiatives
          </Link>
          <Link href="/events" onClick={close} className="text-sm font-medium text-slate-300 hover:text-purple-300 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-colors">
            📅 Events
          </Link>
          {user ? (
            <>
              {/* Mobile user info */}
              <div className="flex items-center gap-3 px-3 py-2 border-t border-white/5 mt-1">
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo_url} alt={user.full_name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              {isAdmin && (
                <Link href="/admin" onClick={close} className="text-sm font-medium text-purple-300 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                  🛡️ Admin Panel
                </Link>
              )}
              <Link href="/dashboard" onClick={close} className="text-sm font-medium text-cyan-300 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors">
                👤 My Profile
              </Link>
              <button
                onClick={() => { close(); handleLogout(); }}
                className="text-left text-sm font-medium text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                🚪 Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={close} className="text-sm font-medium text-slate-300 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" onClick={close} className="text-sm font-medium text-white px-3 py-2 rounded-lg btn-primary text-center">
                Join
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
