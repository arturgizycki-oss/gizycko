import { Skeleton } from "@/components/skeleton";

export default function DiscoverLoading() {
  return (
    <div>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="mt-2 h-3 w-72" />
      <div className="mx-auto mt-6 w-full max-w-sm space-y-3">
        <div className="card overflow-hidden">
          <Skeleton className="h-[min(46dvh,22rem)] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
