import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-titanium-2", className)} />;
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <Shimmer className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="glass space-y-4 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Shimmer className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-3 w-1/3" />
                <Shimmer className="h-3 w-1/5" />
              </div>
            </div>
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-24 w-full" />
            <div className="flex gap-2">
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-5 w-20 rounded-full" />
              <Shimmer className="h-5 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
