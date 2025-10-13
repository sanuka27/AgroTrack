export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Vote buttons skeleton */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded"></div>
          <div className="w-8 h-6 bg-muted rounded"></div>
          <div className="w-8 h-8 bg-muted rounded"></div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full"></div>
            <div className="h-6 w-16 bg-muted rounded-full"></div>
            <div className="h-6 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-4 w-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-3 w-16 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendingTagsSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6 animate-pulse">
      <div className="h-5 bg-muted rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-8"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
