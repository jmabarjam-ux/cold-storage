interface LoadingSkeletonProps {
  rows?: number
  cols?: number
  type?: 'table' | 'chart' | 'card'
}

export default function LoadingSkeleton({ rows = 5, cols = 3, type = 'table' }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 animate-pulse">
        <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
        <div className="h-8 w-16 bg-slate-700 rounded mb-2" />
        <div className="h-2 w-32 bg-slate-700 rounded" />
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 animate-pulse" style={{ minHeight: 300 }}>
        <div className="h-3 w-32 bg-slate-700 rounded mb-6" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-700 rounded-t"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-2 w-8 bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  // Default: table skeleton
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      {/* Table header */}
      <div className="bg-slate-700 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-600 rounded flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-4 py-3 border-t border-slate-700 flex gap-4"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 bg-slate-700 rounded"
              style={{ flex: colIdx === 0 ? '0 0 2rem' : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
