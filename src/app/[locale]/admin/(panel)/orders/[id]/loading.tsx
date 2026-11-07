import { Skeleton } from "@/components/ui/Skeleton";

// loading.tsx automatically wraps the page in <Suspense>: this is shown
// while the order is being loaded on the server.
export default function OrderDetailLoading() {
  return <Skeleton blocks={3} />;
}
