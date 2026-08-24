import { Skeleton, SkeletonRow } from "@/components/skeleton";

export default function MessagesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-full rounded-full" />
      <div className="card divide-y divide-[var(--line)] overflow-hidden">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
