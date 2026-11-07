import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Next.js navigation helpers.
// Always import Link/redirect/usePathname/useRouter from here, not from "next/*",
// so links automatically keep the current language.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
