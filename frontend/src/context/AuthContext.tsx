"use client";

import { createContext, useContext, useState } from "react";
import { UserAdminView } from "@/lib/api";
import { clearSession, getStoredUser, getToken, saveSession } from "@/lib/auth";

interface AuthContextType {
  user: UserAdminView | null;
  token: string | null;
  setSession: (token: string, user: UserAdminView) => void;
  logout: () => void;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializers read localStorage once on first render (no useEffect needed)
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<UserAdminView | null>(() => getStoredUser());

  const setSession = (t: string, u: UserAdminView) => {
    saveSession(t, u);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setSession,
        logout,
        isAdmin: user?.is_admin ?? false,
        isApproved: user?.is_approved ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
