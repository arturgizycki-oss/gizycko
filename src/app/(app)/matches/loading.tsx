import { Skeleton, SkeletonRow } from "@/components/skeleton";

export default function MatchesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-28" />
      <div className="card divide-y divide-[var(--line)] overflow-hidden">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
