"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = {
  error: "wrongPassword" | "notConfigured" | null;
};

// Server Actions run on the server when a form is submitted.
// The browser only sends the form data; the password check happens here.

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  // Validate on the server: never trust what the browser sends.
  if (typeof password !== "string" || password.length === 0 || password.length > 200) {
    return { error: "wrongPassword" };
  }

  const result = await signIn(password);
  if (result !== "ok") {
    return { error: result };
  }
  redirect({ href: "/admin", locale: await getLocale() });
  return { error: null };
}

export async function logout(): Promise<void> {
  await signOut();
  redirect({ href: "/admin/login", locale: await getLocale() });
}
