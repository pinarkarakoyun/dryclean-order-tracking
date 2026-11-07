import { headers } from "next/headers";
import QRCode from "qrcode";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Base URL of the site, e.g. "https://kledingreparatie-mustan.nl".
 * Uses SITE_URL when set (production). Otherwise the address the admin page was
 * opened with, so a QR made on http://192.168.1.15:3000 also works on a phone in the shop.
 */
async function getSiteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/** Full tracking link in the customer's language, e.g. ".../tr/track/<token>". */
export async function getTrackingUrl(token: string, locale: Locale): Promise<string> {
  const path = getPathname({ href: `/track/${token}`, locale });
  return `${await getSiteUrl()}${path}`;
}

/** QR code as an SVG image (data URL), sharp at any size and when printed. */
export async function createQrCodeDataUrl(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 2,
    // "M" still scans when about 15% of the code is damaged (e.g. a crumpled receipt).
    errorCorrectionLevel: "M",
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
