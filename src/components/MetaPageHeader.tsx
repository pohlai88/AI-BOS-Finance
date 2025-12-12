// ============================================================================
// META PAGE HEADER - Standardized Header Component
// Figma Best Practice: Consistent header patterns across all Meta pages
// ============================================================================

import { ReactNode } from 'react'

interface MetaPageHeaderProps {
  variant?: 'document' | 'split' | 'compact'
  code: string
  title: string
  subtitle: string
  description?: string
  actions?: ReactNode
  stats?: Array<{ label: string; value: string }>
}

export function MetaPageHeader({
  variant = 'document',
  code,
  title,
  subtitle,
  description,
  actions,
  stats,
}: MetaPageHeaderProps) {
  // VARIANT: DOCUMENT (Default - Used in META_01, META_02, META_05)
  if (variant === 'document') {
    return (
      <div className="mb-24 flex flex-col items-start justify-between gap-8 border-b border-[#1F1F1F] pb-8 md:flex-row md:items-end">
        <div>
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#28E7A2]">
            {code} // {subtitle}
          </div>
          <h1 className="mb-4 text-5xl leading-tight tracking-[-0.04em] text-white md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-lg text-[#888] md:text-xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    )
  }

  // VARIANT: SPLIT (Used in META_04, META_06, META_07)
  if (variant === 'split') {
    return (
      <div className="mb-16">
        <div className="grid grid-cols-1 items-end gap-12 border-b border-[#1F1F1F] pb-8 lg:grid-cols-2">
          {/* Left: Text */}
          <div>
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#28E7A2]">
              {code} // {subtitle}
            </div>
            <h1 className="mb-4 text-5xl leading-tight tracking-[-0.04em] text-white md:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-xl text-lg text-[#888]">{description}</p>
            )}
          </div>

          {/* Right: Stats or Actions */}
          <div className="flex flex-col gap-4">
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="border border-[#1F1F1F] bg-[#0A0A0A] p-4"
                  >
                    <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#28E7A2]/20 to-transparent" />
                    <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[#666]">
                      {stat.label}
                    </div>
                    <div className="text-2xl tracking-tight text-white">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {actions && <div className="flex justify-end gap-3">{actions}</div>}
          </div>
        </div>
      </div>
    )
  }

  // VARIANT: COMPACT (Used in META_03, toolbar-style)
  if (variant === 'compact') {
    return (
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1F1F1F] px-6">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#28E7A2]">
            {code}
          </div>
          <div className="h-4 w-[1px] bg-[#333]" />
          <h1 className="text-sm tracking-wide text-white">{title}</h1>
          {subtitle && (
            <>
              <div className="h-4 w-[1px] bg-[#333]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#666]">
                {subtitle}
              </span>
            </>
          )}
        </div>

        {/* Right: Actions */}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    )
  }

  return null
}
