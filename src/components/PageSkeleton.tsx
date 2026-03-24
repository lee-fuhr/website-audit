/**
 * Content-shaped skeleton screens for page loading states.
 * Replaces full-page spinners (Bible §6.13) with layout-matching
 * placeholders that preserve spatial context during data fetches.
 */

/**
 * Skeleton for preview page: dark sidebar (w-64) + header + content cards.
 * Matches SideNavigation + PageHeader + view content layout.
 */
export function PreviewSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar skeleton — matches SideNavigation w-64, dark bg */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 bg-gray-900 p-6">
        {/* Company name area */}
        <div className="mb-2">
          <div className="h-4 bg-gray-800 rounded animate-pulse w-2/3" />
        </div>
        <div className="h-3 bg-gray-800/60 rounded animate-pulse w-1/2 mb-8" />
        {/* Nav items */}
        <div className="space-y-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-800 rounded animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Bottom button placeholder */}
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="h-10 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1">
        {/* Mobile top bar placeholder */}
        <div className="lg:hidden h-[52px] border-b border-[var(--border)] bg-[var(--background)]" />

        {/* Page header skeleton */}
        <div className="border-b border-[var(--border)] p-6 md:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
            </div>
          </div>
          {/* Score badges row */}
          <div className="flex gap-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 bg-gray-100 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Content cards */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Section heading */}
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />

          {/* Card grid */}
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>

          {/* Additional content block */}
          <div className="mt-8 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-1/5" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-100 rounded animate-pulse"
                style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for results page: accent-colored sidebar (w-64) + header + content.
 * Matches the fixed nav with bg-[var(--accent)] + main content at lg:ml-64.
 */
export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar skeleton — matches results nav: w-64, accent bg */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 bg-[var(--accent)] p-8">
        {/* Label + title */}
        <div className="mb-10">
          <div className="h-3 bg-white/20 rounded animate-pulse w-1/2 mb-2" />
          <div className="h-5 bg-white/30 rounded animate-pulse w-3/4" />
        </div>
        {/* Nav items */}
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-11 bg-white/10 rounded animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Bottom button */}
        <div className="mt-auto pt-8 border-t border-white/20">
          <div className="h-11 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1">
        {/* Header skeleton — matches border-b-4 accent header */}
        <div className="border-b-4 border-[var(--accent)] py-8 md:py-12 px-6 md:px-8">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3 mb-3" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2 mb-4" />
          <div className="flex gap-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
          </div>
        </div>

        {/* Content blocks */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Overview section */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Analysis section */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for processing page Suspense fallback.
 * Matches the centered layout with enrichment bar + progress area.
 */
export function ProcessingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col p-6">
      {/* Enrichment bar skeleton */}
      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-lg animate-pulse flex-1"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Centered processing content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-8 text-center">
          {/* Phase label */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mx-auto" />

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4 mx-auto" />
          </div>

          {/* Status message area */}
          <div className="space-y-3 mt-6">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2 mx-auto" />
          </div>

          {/* Crawled pages list placeholder */}
          <div className="mt-8 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-gray-50 rounded animate-pulse"
                style={{ width: `${70 - i * 10}%`, margin: '0 auto', animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
