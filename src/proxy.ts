import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { NOT_FOUND_LOCALE_HEADER } from "./i18n/not-found-locale";
import { routing } from "./i18n/routing";
import { isOrderTrackingEnabled } from "./lib/features";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

// Resolves the language from the URL (e.g. /tr/contact -> "tr", /contact -> default "nl").
const handleI18nRouting = createMiddleware(routing);

const LOCALE_PREFIX = `(/(?:${routing.locales.join("|")}))?`;

// Matches "/admin..." with an optional language prefix, e.g. "/tr/admin/orders".
const ADMIN_PATH = new RegExp(`^${LOCALE_PREFIX}/admin(/.*)?$`);

// Everything of the order module: the admin panel and the customer tracking pages.
const ORDER_MODULE_PATH = new RegExp(`^${LOCALE_PREFIX}/(?:admin|track)(?:/.*)?$`);

// Folders starting with "_" are private in Next.js, so no page can ever live here.
const MISSING_PAGE = "/_order-module-disabled";

// Runs before every page request.
export default async function proxy(request: NextRequest) {
  const moduleMatch = request.nextUrl.pathname.match(ORDER_MODULE_PATH);
  if (moduleMatch && !isOrderTrackingEnabled()) {
    return showNotFound(request, moduleMatch[1]);
  }

  const match = request.nextUrl.pathname.match(ADMIN_PATH);

  if (match) {
    const localePrefix = match[1] ?? "";
    const isLoginPage = match[2] === "/login";
    const isSignedIn = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value,
    );

    // Fast first check. Admin data is checked again on the server (requireAdmin).
    if (!isSignedIn && !isLoginPage) {
      return NextResponse.redirect(
        new URL(`${localePrefix}/admin/login`, request.url),
      );
    }
    if (isSignedIn && isLoginPage) {
      return NextResponse.redirect(new URL(`${localePrefix}/admin`, request.url));
    }
  }

  return handleI18nRouting(request);
}

/**
 * Order module turned off: answer with the translated 404 page.
 * The request is rewritten (not redirected) to a path that has no page, so the
 * visitor gets a real 404 and the address bar keeps what they typed.
 * The language goes along in a header, because the 404 page has no URL parameters.
 */
function showNotFound(request: NextRequest, localePrefix: string | undefined) {
  const locale = localePrefix ? localePrefix.slice(1) : routing.defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${MISSING_PAGE}`;

  const headers = new Headers(request.headers);
  headers.set(NOT_FOUND_LOCALE_HEADER, locale);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension (images, favicon...).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
