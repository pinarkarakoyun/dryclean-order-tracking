import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isOrderTrackingEnabled } from "./features";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "./session";

// Prototype login: one shared password from the ADMIN_PASSWORD environment variable.
// Later this can be replaced by real accounts (e.g. Supabase Auth) without changing pages.

export type SignInResult = "ok" | "wrongPassword" | "notConfigured";

/** Compares two strings in constant time, so the response time leaks nothing about the password. */
function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export async function signIn(password: string): Promise<SignInResult> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return "notConfigured";

  if (!safeEqual(password, adminPassword)) {
    // Small delay to slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return "wrongPassword";
  }

  const token = await createSessionToken();
  if (!token) return "notConfigured";

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable by JavaScript in the browser
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return "ok";
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Call before reading or changing admin data (Data Access Layer pattern).
 * src/proxy.ts already redirects logged-out visitors, but this second check
 * protects the data even if a page or server action is reached another way.
 */
export async function requireAdmin(): Promise<void> {
  // Server actions are reachable without a page: refuse them when the order module is off.
  if (!isOrderTrackingEnabled()) notFound();
  if (!(await isSignedIn())) {
    redirect({ href: "/admin/login", locale: await getLocale() });
  }
}
