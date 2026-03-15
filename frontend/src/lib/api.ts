// Server-side (SSR/RSC): use API_URL to reach the backend container by name.
// Client-side (browser): use NEXT_PUBLIC_API_URL (public, baked at build time).
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export type CurrentStatus = "job" | "studying" | "business" | "farming" | "other";
export type EducationStage = "school" | "college" | "working" | "other";
export type CollegeDomain = "engineering" | "medicine" | "arts" | "science" | "commerce" | "law" | "other";
export type AchievementCategory = "academic" | "sports" | "cultural" | "community" | "leadership";
export type InitiativeStatus = "planned" | "ongoing" | "completed";
export type InitiativeCategory = "education" | "sports" | "environment" | "infrastructure" | "arts" | "health" | "technology" | "other";
export type AccoladeCategory = "hardworking" | "inspiring" | "helpful" | "creative" | "leader" | "sporty" | "academic" | "kind";
export type EventType = "festival" | "sports" | "cultural" | "educational" | "health" | "community" | "other";

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
  username?: string;
  // Education fields
  education_stage?: EducationStage;
  school_grade?: number;
  college_name?: string;
  college_domain?: CollegeDomain;
  graduation_year?: number;
  // Activities
  sports?: string;
  activities?: string;
  // Gamification
  points?: number;
  avatar_key?: string;
  achievements?: AchievementOut[];
}

export interface UserPrivate extends UserPublic {
  phone?: string;
  date_of_birth?: string;
}

export interface UserAdminView extends UserPrivate {
  email: string;
  username?: string;
  is_approved: boolean;
  is_admin: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserAdminView;
}

export interface AchievementOut {
  id: number;
  title: string;
  description?: string;
  category: AchievementCategory;
  icon?: string;
  points_awarded: number;
  awarded_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserPublic;
}

export interface InitiativeOut {
  id: number;
  title: string;
  description?: string;
  status: InitiativeStatus;
  category: InitiativeCategory;
  lead_user?: UserPublic;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  participants: UserPublic[];
  participant_count: number;
  is_participant: boolean;
}

export interface ProgressUpdateOut {
  id: number;
  content: string;
  author?: UserPublic;
  created_at?: string;
}

export interface AccoladeOut {
  id: number;
  from_user: UserPublic;
  to_user: UserPublic;
  category: AccoladeCategory;
  emoji: string;
  message?: string;
  created_at?: string;
}

export interface AccoladeSummary {
  category: AccoladeCategory;
  emoji: string;
  count: number;
}

export interface AccoladeStats {
  total: number;
  by_category: AccoladeSummary[];
  recent: AccoladeOut[];
}

export interface EventOut {
  id: number;
  title: string;
  description?: string;
  event_type: EventType;
  event_date: string;
  end_date?: string;
  location?: string;
  cover_emoji?: string;
  created_by?: UserPublic;
  created_at?: string;
  attendee_count: number;
  is_attending: boolean;
  attendees: UserPublic[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: optHeaders, ...restOptions } = options ?? {};
  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: { "Content-Type": "application/json", ...optHeaders },
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
  username?: string;
  village_area?: string;
  current_status?: CurrentStatus;
  current_status_detail?: string;
  education?: string;
  bio?: string;
  phone?: string;
  education_stage?: EducationStage;
  school_grade?: number;
  college_name?: string;
  college_domain?: CollegeDomain;
  graduation_year?: number;
  avatar_key?: string;
}) => request<{ message: string }>("/auth/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (email_or_username: string, password: string) =>
  request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email_or_username, password }) });

export const getMe = (token: string) =>
  request<UserAdminView>("/auth/me", { headers: authHeaders(token) });

export type UserUpdate = Partial<UserPrivate> & {
  education_stage?: EducationStage;
  school_grade?: number;
  college_name?: string;
  college_domain?: CollegeDomain;
  graduation_year?: number;
  sports?: string;
  activities?: string;
  avatar_key?: string;
};

export const updateProfile = (token: string, data: UserUpdate) =>
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

export const removeAdmin = (token: string, id: number) =>
  request<UserAdminView>(`/admin/remove-admin/${id}`, { method: "POST", headers: authHeaders(token) });

export const disableUser = (token: string, id: number) =>
  request<UserAdminView>(`/admin/disable/${id}`, { method: "POST", headers: authHeaders(token) });

export const enableUser = (token: string, id: number) =>
  request<UserAdminView>(`/admin/enable/${id}`, { method: "POST", headers: authHeaders(token) });

export const adminCreateProfile = (token: string, data: {
  full_name: string;
  email?: string;
  village_area?: string;
  bio?: string;
  current_status?: CurrentStatus;
  phone?: string;
}) => request<UserAdminView>("/admin/create-profile", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

// --- Leaderboard ---
export const getLeaderboard = (category?: string) => {
  const qs = category ? `?category=${category}` : "";
  return request<LeaderboardEntry[]>(`/leaderboard${qs}`);
};

// --- Initiatives ---
export const getInitiatives = (params?: { status?: string; category?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<InitiativeOut[]>(`/initiatives${qs ? `?${qs}` : ""}`);
};

export const getInitiative = (id: number) => request<InitiativeOut>(`/initiatives/${id}`);

export const createInitiative = (token: string, data: {
  title: string;
  description?: string;
  status: InitiativeStatus;
  category: InitiativeCategory;
  lead_user_id: number;  // required — every initiative must have a PIC/leader
  start_date?: string;
  end_date?: string;
}) => request<InitiativeOut>("/initiatives", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const updateInitiative = (token: string, id: number, data: Partial<{
  title: string;
  description: string;
  status: InitiativeStatus;
  category: InitiativeCategory;
  lead_user_id: number;
  start_date: string;
  end_date: string;
}>) => request<InitiativeOut>(`/initiatives/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });

export const deleteInitiative = (token: string, id: number) =>
  fetch(`${BASE_URL}/initiatives/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const joinInitiative = (token: string, id: number) =>
  request<InitiativeOut>(`/initiatives/${id}/join`, { method: "POST", headers: authHeaders(token) });

export const leaveInitiative = (token: string, id: number) =>
  request<InitiativeOut>(`/initiatives/${id}/leave`, { method: "DELETE", headers: authHeaders(token) });

export const getProgressUpdates = (id: number) =>
  request<ProgressUpdateOut[]>(`/initiatives/${id}/progress`);

export const addProgressUpdate = (token: string, id: number, content: string) =>
  request<ProgressUpdateOut>(`/initiatives/${id}/progress`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });

export const deleteProgressUpdate = (token: string, initiativeId: number, updateId: number) =>
  fetch(`${BASE_URL}/initiatives/${initiativeId}/progress/${updateId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export const awardAchievement = (token: string, userId: number, data: {
  title: string;
  description?: string;
  category: AchievementCategory;
  icon?: string;
  points_awarded?: number;
}) => request<AchievementOut>(`/admin/users/${userId}/award`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

// --- Auth: Password Reset ---
export const forgotPassword = (email: string) =>
  request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, new_password: string) =>
  request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });

// --- Events ---
export const getEvents = (params?: { upcoming?: boolean; event_type?: string }) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return request<EventOut[]>(`/events${qs ? `?${qs}` : ""}`);
};

export const createEvent = (token: string, data: {
  title: string;
  description?: string;
  event_type: EventType;
  event_date: string;
  end_date?: string;
  location?: string;
  cover_emoji?: string;
}) => request<EventOut>("/events", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const updateEvent = (token: string, id: number, data: Partial<{
  title: string;
  description: string;
  event_type: EventType;
  event_date: string;
  end_date: string;
  location: string;
  cover_emoji: string;
}>) => request<EventOut>(`/events/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });

export const deleteEvent = (token: string, id: number) =>
  fetch(`${BASE_URL}/events/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const attendEvent = (token: string, id: number) =>
  request<EventOut>(`/events/${id}/attend`, { method: "POST", headers: authHeaders(token) });

export const leaveEvent = (token: string, id: number) =>
  request<EventOut>(`/events/${id}/attend`, { method: "DELETE", headers: authHeaders(token) });

// --- Notifications ---
export interface NotificationOut {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  actor_id?: number;
  created_at?: string;
}

export const getNotifications = (token: string) =>
  request<NotificationOut[]>("/notifications", { headers: authHeaders(token) });

export const getUnreadCount = (token: string) =>
  request<{ count: number }>("/notifications/unread-count", { headers: authHeaders(token) });

export const markNotificationRead = (token: string, id: number) =>
  request<NotificationOut>(`/notifications/${id}/read`, { method: "POST", headers: authHeaders(token) });

export const markAllNotificationsRead = (token: string) =>
  request<{ ok: boolean }>("/notifications/read-all", { method: "POST", headers: authHeaders(token) });

// --- Accolades ---
export const getUserAccolades = (userId: number) =>
  request<AccoladeStats>(`/accolades/user/${userId}`);

export const giveAccolade = (token: string, data: {
  to_user_id: number;
  category: AccoladeCategory;
  message?: string;
}) => request<AccoladeOut>("/accolades", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const deleteAccolade = (token: string, id: number) =>
  fetch(`${BASE_URL}/accolades/${id}`, { method: "DELETE", headers: authHeaders(token) });
