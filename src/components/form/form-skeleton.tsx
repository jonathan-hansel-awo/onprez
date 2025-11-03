import { Skeleton } from '@/components/ui/skeleton'

export function FormSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      <Skeleton className="h-12 w-full" />
    </div>
  )
}
