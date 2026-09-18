// Simple cookie-based session management (no external auth library needed)
import { cookies } from "next/headers";

export interface SessionUser {
  id: number;
  name: string;
  username: string;
  roleId: number | null;
  roleName: string;
  permissions: Record<string, boolean>;
  avatar: string;
}

const SESSION_COOKIE = "app_session";

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie) return null;
    const data = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    return data as SessionUser;
  } catch {
    return null;
  }
}

export function createSessionValue(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
