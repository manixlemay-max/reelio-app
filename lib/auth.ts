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
