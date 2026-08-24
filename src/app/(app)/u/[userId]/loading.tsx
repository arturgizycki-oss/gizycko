import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <Skeleton className="h-44 w-full rounded-none sm:h-56" />
        <div className="flex gap-2 p-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-4 border-t border-[var(--line)] p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
