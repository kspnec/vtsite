const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type CurrentStatus = "job" | "studying" | "business" | "farming" | "other";

export interface UserPublic {
  id: number;
  full_name: string;
  photo_url?: string;
  village_area?: string;
  current_status?: CurrentStatus;
  current_status_detail?: string;
  education?: string;
  bio?: string;
  created_at?: string;
}

export interface UserPrivate extends UserPublic {
  phone?: string;
  date_of_birth?: string;
}

export interface UserAdminView extends UserPrivate {
  email: string;
  is_approved: boolean;
  is_admin: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserAdminView;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// --- Public ---
export const getProfiles = (params?: { village_area?: string; current_status?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<UserPublic[]>(`/profiles${qs ? `?${qs}` : ""}`);
};

export const getProfile = (id: number) => request<UserPublic>(`/profiles/${id}`);

export const getFullProfile = (id: number, token: string) =>
  request<UserPrivate>(`/profiles/${id}/full`, { headers: authHeaders(token) });

// --- Auth ---
export const signup = (data: {
  email: string;
  password: string;
  full_name: string;
  village_area?: string;
  current_status?: CurrentStatus;
  current_status_detail?: string;
  education?: string;
  bio?: string;
  phone?: string;
}) => request<{ message: string }>("/auth/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (email: string, password: string) =>
  request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getMe = (token: string) =>
  request<UserAdminView>("/auth/me", { headers: authHeaders(token) });

export const updateProfile = (token: string, data: Partial<UserPrivate>) =>
  request<UserAdminView>("/auth/me", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const uploadPhoto = async (token: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/upload/photo`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json() as Promise<{ photo_url: string }>;
};

// --- Admin ---
export const getPending = (token: string) =>
  request<UserAdminView[]>("/admin/pending", { headers: authHeaders(token) });

export const getAllUsers = (token: string, approved?: boolean) => {
  const qs = approved !== undefined ? `?approved=${approved}` : "";
  return request<UserAdminView[]>(`/admin/users${qs}`, { headers: authHeaders(token) });
};

export const approveUser = (token: string, id: number) =>
  request<UserAdminView>(`/admin/approve/${id}`, { method: "POST", headers: authHeaders(token) });

export const rejectUser = (token: string, id: number) =>
  request<UserAdminView>(`/admin/reject/${id}`, { method: "POST", headers: authHeaders(token) });

export const deleteUser = (token: string, id: number) =>
  fetch(`${BASE_URL}/admin/users/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const makeAdmin = (token: string, id: number) =>
  request<UserAdminView>(`/admin/make-admin/${id}`, { method: "POST", headers: authHeaders(token) });
