import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
