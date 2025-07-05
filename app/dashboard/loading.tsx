export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">
          {/* TopNav skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  )
}