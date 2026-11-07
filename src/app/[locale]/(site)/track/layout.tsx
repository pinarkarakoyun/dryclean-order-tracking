import { notFound } from "next/navigation";
import { isOrderTrackingEnabled } from "@/lib/features";

// Covers /track and /track/<token>. Second check after src/proxy.ts:
// customer tracking belongs to the order module.
export default function TrackLayout({ children }: LayoutProps<"/[locale]/track">) {
  if (!isOrderTrackingEnabled()) notFound();
  return children;
}
