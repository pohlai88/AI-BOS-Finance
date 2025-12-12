// ============================================================================
// META PAGE SKELETON - Loading State Component
// Figma Best Practice: Skeleton screens for perceived performance
// ============================================================================

interface MetaPageSkeletonProps {
  variant?: 'document' | 'grid' | 'table' | 'interactive'
}

export function MetaPageSkeleton({
  variant = 'document',
}: MetaPageSkeletonProps) {
  // Shared skeleton block component
  const Block = ({
    className = '',
    height = 'h-4',
  }: {
    className?: string
    height?: string
  }) => (
    <div
      className={`border border-[#1F1F1F] bg-[#0A0A0A] ${height} ${className} animate-pulse`}
    >
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#28E7A2]/10 to-transparent" />
    </div>
  )

  if (variant === 'document') {
    return (
      <div className="px-12 py-[80px]">
        <div className="mx-auto max-w-[1600px]">
          {/* Header Skeleton */}
          <div className="mb-24 border-b border-[#1F1F1F] pb-8">
            <Block height="h-3" className="mb-4 w-48" />
            <Block height="h-16" className="mb-4 w-full max-w-2xl" />
            <Block height="h-6" className="w-full max-w-xl" />
          </div>

          {/* Section Label */}
          <div className="mb-12 flex items-center gap-4">
            <Block height="h-2" className="w-32" />
            <div className="h-[1px] flex-1 bg-[#1F1F1F]" />
          </div>

          {/* Content Grid */}
          <div className="mb-[240px] grid grid-cols-12 gap-12">
            <div className="col-span-7 space-y-4">
              <Block height="h-12" />
              <Block height="h-24" />
              <Block height="h-6" />
            </div>
            <div className="col-span-5">
              <Block height="h-64" />
            </div>
          </div>

          {/* Additional Sections */}
          <div className="space-y-8">
            <Block height="h-48" />
            <Block height="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="px-12 py-[80px]">
        <div className="mx-auto max-w-[1600px]">
          {/* Header */}
          <div className="mb-16">
            <Block height="h-3" className="mb-4 w-48" />
            <Block height="h-12" className="mb-4 w-full max-w-2xl" />
            <Block height="h-6" className="w-full max-w-xl" />
          </div>

          {/* Toolbar */}
          <div className="mb-8 flex gap-4">
            <Block height="h-10" className="w-64" />
            <Block height="h-10" className="w-32" />
            <Block height="h-10" className="w-32" />
            <div className="flex-1" />
            <Block height="h-10" className="w-40" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Block key={i} height="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="flex h-screen flex-col">
        {/* Toolbar */}
        <div className="flex h-14 shrink-0 items-center gap-4 border-b border-[#1F1F1F] px-6">
          <Block height="h-8" className="w-48" />
          <Block height="h-8" className="w-32" />
          <div className="flex-1" />
          <Block height="h-8" className="w-24" />
          <Block height="h-8" className="w-24" />
        </div>

        {/* Table Header */}
        <div className="flex h-12 shrink-0 items-center gap-4 border-b border-[#1F1F1F] px-6">
          <Block height="h-4" className="w-8" />
          <Block height="h-4" className="flex-1" />
          <Block height="h-4" className="w-32" />
          <Block height="h-4" className="w-32" />
          <Block height="h-4" className="w-32" />
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex h-16 items-center gap-4 border-b border-[#1F1F1F] px-6"
            >
              <Block height="h-4" className="w-8" />
              <Block height="h-6" className="flex-1" />
              <Block height="h-4" className="w-32" />
              <Block height="h-4" className="w-32" />
              <Block height="h-4" className="w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'interactive') {
    return (
      <div className="flex h-screen flex-col p-8">
        {/* Header */}
        <div className="mb-8">
          <Block height="h-3" className="mb-4 w-48" />
          <Block height="h-10" className="w-full max-w-xl" />
        </div>

        {/* Interactive Area */}
        <div className="flex flex-1 gap-8">
          {/* Left Panel */}
          <div className="w-80 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Block key={i} height="h-20" />
            ))}
          </div>

          {/* Main Canvas */}
          <div className="flex-1">
            <Block height="h-full" />
          </div>
        </div>
      </div>
    )
  }

  return null
}
