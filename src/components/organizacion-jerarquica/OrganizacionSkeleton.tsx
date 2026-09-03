import { Skeleton } from "@/components/ui/skeleton";

function FilaTablaSkeleton({ sangria = 0 }: { sangria?: number }) {
  return (
    <tr className="border-b border-border last:border-0 dark:border-zinc-800">
      <td className="px-4 py-2">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: sangria }}
        >
          <Skeleton className="size-4 shrink-0 rounded-md" />
          <Skeleton className="size-4 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3.5 w-40 max-w-full rounded-md" />
            <Skeleton className="h-2.5 w-24 rounded-md" />
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex justify-end">
          <Skeleton className="size-6 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function OrganizacionStatsSkeleton() {
  return (
    <div className="grid w-full shrink-0 grid-cols-3 gap-3 lg:w-auto lg:min-w-[420px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3"
        >
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-8 w-10 rounded-lg" />
          <Skeleton className="h-2.5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function OrganizacionSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-none border border-border bg-card max-md:border-x-0 md:rounded-xl dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-border bg-sky-50/80 dark:border-zinc-700 dark:bg-sky-950/30">
            <th className="px-4 py-2.5">
              <Skeleton className="h-3 w-16 rounded-md" />
            </th>
            <th className="px-4 py-2.5">
              <div className="flex justify-end">
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <FilaTablaSkeleton />
          <FilaTablaSkeleton sangria={14} />
          <FilaTablaSkeleton sangria={28} />
          <FilaTablaSkeleton sangria={14} />
          <FilaTablaSkeleton sangria={28} />
        </tbody>
      </table>
    </div>
  );
}
