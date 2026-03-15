"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationOut,
} from "@/lib/api";

const TYPE_ICON: Record<string, string> = {
  accolade_received:    "🏅",
  achievement_awarded:  "🏆",
  initiative_joined:    "🌱",
  account_approved:     "✅",
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const { count } = await getUnreadCount(token);
      setUnread(count);
    } catch { /* ignore */ }
  }, [token]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!token) return;
    fetchCount(); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [token, fetchCount]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!token || loaded) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data);
      setLoaded(true);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    if (!token) return;
    await markNotificationRead(token, id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-white/10 shadow-2xl shadow-black/40 z-50 flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {!loaded ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <div className="text-3xl mb-2">🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 flex gap-3 hover:bg-white/5 transition-colors ${n.is_read ? "opacity-50" : ""}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                    {n.created_at && (
                      <p className="text-xs text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
