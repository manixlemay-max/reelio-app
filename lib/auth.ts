export const AUTH_COOKIE = "reelio_auth";

// Uses the Web Crypto API (not Node's `crypto` module) because this code
// also runs in Next.js middleware, which executes on the Edge runtime.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAuthValue(): Promise<string | null> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return null;
  return hashPassword(password);
}

// Server-side guard for API routes that expose or mutate client data (leads,
// videos, products, posts, analytics, etc.) and are only ever meant to be
// called from the password-protected /dashboard pages. Next's middleware
// only runs on page navigations matched by its `config.matcher`, NOT on API
// routes hit directly (e.g. curl or fetch from any origin) — so without this,
// anyone who knows the URL could read every client's name, email and product
// info from /api/leads with no login at all. Mirrors the same "no password
// configured -> don't lock out" behavior as middleware.ts for local dev.
export async function isDashboardAuthed(req: { cookies: { get(name: string): { value: string } | undefined } }): Promise<boolean> {
  const expected = await expectedAuthValue();
  if (!expected) return true;
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  return cookie === expected;
}
