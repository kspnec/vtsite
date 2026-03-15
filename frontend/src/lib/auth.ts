"use client";

import { UserAdminView } from "./api";

const TOKEN_KEY = "vtsite_token";
const USER_KEY = "vtsite_user";

export function saveSession(token: string, user: UserAdminView) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Presence cookie lets the Next.js middleware gate protected routes server-side
  document.cookie = `vtsite_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  // Ensure the presence cookie is set for existing sessions (migrates users
  // who logged in before the cookie was introduced)
  if (token) {
    document.cookie = `vtsite_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
  return token;
}

export function getStoredUser(): UserAdminView | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `vtsite_auth=; path=/; max-age=0; SameSite=Lax`;
}
