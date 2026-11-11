import { Skeleton } from "@/components/ui/Skeleton";

// loading.tsx automatically wraps the page in <Suspense>: this is shown
// while the customer is being loaded on the server.
export default function CustomerLoading() {
  return <Skeleton blocks={3} />;
}
