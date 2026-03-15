const API = process.env.BASE_URL
  ? process.env.BASE_URL.replace(":3000", ":8000")
  : "http://localhost:8000";

const ADMIN = { email: "admin@village.com", password: "admin123" };

async function adminToken(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email_or_username: ADMIN.email, password: ADMIN.password }),
  });
  const data = await res.json();
  return data.access_token;
}

/** Delete all users whose email matches any of the given patterns (substring match). */
export async function cleanupTestUsers(...emailPatterns: string[]) {
  try {
    const token = await adminToken();
    const res = await fetch(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users: { id: number; email: string; is_approved: boolean; is_active: boolean }[] = await res.json();
    const targets = users.filter(u => emailPatterns.some(p => u.email.includes(p)));
    // Disable approved+active users first, then delete
    for (const u of targets) {
      if (u.is_approved && u.is_active) {
        await fetch(`${API}/admin/disable/${u.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetch(`${API}/admin/users/${u.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // non-fatal — cleanup best-effort
  }
}
