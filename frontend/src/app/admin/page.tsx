"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { approveUser, deleteUser, getPending, getAllUsers, makeAdmin, rejectUser, UserAdminView } from "@/lib/api";

type Tab = "pending" | "all";

export default function AdminPage() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<UserAdminView[]>([]);
  const [all, setAll] = useState<UserAdminView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    if (!isAdmin) { router.push("/"); return; }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, a] = await Promise.all([getPending(token), getAllUsers(token)]);
      setPending(p);
      setAll(a);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    await approveUser(token, id);
    fetchData();
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    await rejectUser(token, id);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this user permanently?")) return;
    await deleteUser(token, id);
    fetchData();
  };

  const handleMakeAdmin = async (id: number) => {
    if (!token || !confirm("Make this user an admin?")) return;
    await makeAdmin(token, id);
    fetchData();
  };

  const list = tab === "pending" ? pending : all;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Admin Panel</h1>
      <p className="text-slate-400 mb-8 text-sm">Manage member profiles and approvals</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-500/30"
                : "glass text-slate-400 border border-white/5 hover:border-cyan-500/20 hover:text-slate-200"
            }`}
          >
            {t === "pending" ? `Pending (${pending.length})` : `All Members (${all.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">{tab === "pending" ? "✅" : "👥"}</div>
          <p>{tab === "pending" ? "No pending approvals!" : "No members yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              showApproval={tab === "pending"}
              onApprove={() => handleApprove(u.id)}
              onReject={() => handleReject(u.id)}
              onDelete={() => handleDelete(u.id)}
              onMakeAdmin={() => handleMakeAdmin(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  showApproval,
  onApprove,
  onReject,
  onDelete,
  onMakeAdmin,
}: {
  user: UserAdminView;
  showApproval: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onMakeAdmin: () => void;
}) {
  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 flex-wrap">
      {/* Avatar */}
      {user.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photo_url} alt={user.full_name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">{initials}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-100">{user.full_name}</p>
          {user.is_admin && (
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full font-medium">Admin</span>
          )}
          {!user.is_approved && (
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-full font-medium">Pending</span>
          )}
          {user.is_approved && (
            <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full font-medium">Approved</span>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate">{user.email}</p>
        {user.village_area && <p className="text-xs text-slate-500">📍 {user.village_area}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {showApproval && (
          <>
            <button onClick={onApprove}
              className="text-sm font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-4 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
              Approve
            </button>
            <button onClick={onReject}
              className="text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/25 px-4 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
              Reject
            </button>
          </>
        )}
        {!showApproval && !user.is_admin && (
          <button onClick={onMakeAdmin}
            className="text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25 px-4 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors">
            Make Admin
          </button>
        )}
        <button onClick={onDelete}
          className="text-sm text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
