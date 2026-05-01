export default function SkeletonMenu() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="panel flex gap-3 p-3">
          <div className="h-28 w-28 animate-pulse rounded-lg bg-orange-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-orange-100 dark:bg-slate-800" />
            <div className="h-3 w-full animate-pulse rounded bg-orange-100 dark:bg-slate-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-orange-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
