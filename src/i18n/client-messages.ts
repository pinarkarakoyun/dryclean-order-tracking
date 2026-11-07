import type { Messages } from "next-intl";
import { getMessages } from "next-intl/server";

// Server components read translations on the server; only client components
// ("use client") need messages in the browser. Sending just those namespaces
// keeps pages small and keeps admin texts out of the public website.

type Namespace = keyof Messages;

/** Used by client components on the public site (language switcher, not-found page). */
export const PUBLIC_CLIENT_NAMESPACES = [
  "LanguageSwitcher",
  "NotFound",
  "Common",
] as const satisfies readonly Namespace[];

/** Used by client components in the admin panel (forms, not-found page). */
export const ADMIN_CLIENT_NAMESPACES = [
  "LanguageSwitcher",
  "AdminLogin",
  "NewOrder",
  "EditOrder",
  "OrderDetail",
] as const satisfies readonly Namespace[];

export async function getClientMessages(
  namespaces: readonly Namespace[],
): Promise<Partial<Messages>> {
  const messages = await getMessages();
  return Object.fromEntries(namespaces.map((namespace) => [namespace, messages[namespace]]));
}
