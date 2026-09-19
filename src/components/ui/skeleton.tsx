import { cn } from 'cn'

// Skeleton پایه — shimmer طلایی-کرمی به جای pulse ساده
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-md', className)}
      {...props}
    />
  )
}

// اسکلت متن — چند خط با عرض‌های متفاوت
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: `${100 - i * 18}%` }} />
      ))}
    </div>
  )
}

// اسکلت کارت — هدر + محتوا
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-card border-border/60 rounded-xl border p-5', className)}
      aria-hidden="true"
    >
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="mb-2 h-7 w-40" />
      <SkeletonText lines={2} className="mt-4" />
    </div>
  )
}

// اسکلت آیتم لیست/تراکنش
function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)} aria-hidden="true">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonListItem }
