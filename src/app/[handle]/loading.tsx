export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="h-[500px] bg-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-16 space-y-8">
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
      </div>
    </div>
  )
}
