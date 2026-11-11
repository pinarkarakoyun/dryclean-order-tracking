import { Skeleton } from "@/components/ui/Skeleton";

// loading.tsx automatically wraps the page in <Suspense>: shown while the product loads.
export default function ProductLoading() {
  return <Skeleton blocks={2} />;
}
