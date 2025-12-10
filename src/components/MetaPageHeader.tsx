// ============================================================================
// META PAGE HEADER - Standardized Header Component
// Figma Best Practice: Consistent header patterns across all Meta pages
// ============================================================================

import { ReactNode } from 'react';

interface MetaPageHeaderProps {
  variant?: 'document' | 'split' | 'compact';
  code: string;
  title: string;
  subtitle: string;
  description?: string;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string; }>;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 border-b border-[#1F1F1F] pb-8 gap-8">
        <div>
          <div className="text-[#28E7A2] font-mono text-xs tracking-[0.2em] mb-4 uppercase">
            {code} // {subtitle}
          </div>
          <h1 className="text-white text-5xl md:text-6xl tracking-[-0.04em] mb-4 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[#888] text-lg md:text-xl max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }

  // VARIANT: SPLIT (Used in META_04, META_06, META_07)
  if (variant === 'split') {
    return (
      <div className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end border-b border-[#1F1F1F] pb-8">
          
          {/* Left: Text */}
          <div>
            <div className="text-[#28E7A2] font-mono text-xs tracking-[0.2em] mb-4 uppercase">
              {code} // {subtitle}
            </div>
            <h1 className="text-white text-5xl md:text-6xl tracking-[-0.04em] mb-4 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-[#888] text-lg max-w-xl">
                {description}
              </p>
            )}
          </div>

          {/* Right: Stats or Actions */}
          <div className="flex flex-col gap-4">
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-[#0A0A0A] border border-[#1F1F1F] p-4">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#28E7A2]/20 to-transparent" />
                    <div className="font-mono text-xs text-[#666] uppercase tracking-wider mb-2">
                      {stat.label}
                    </div>
                    <div className="text-2xl text-white tracking-tight">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {actions && (
              <div className="flex gap-3 justify-end">
                {actions}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // VARIANT: COMPACT (Used in META_03, toolbar-style)
  if (variant === 'compact') {
    return (
      <div className="h-14 border-b border-[#1F1F1F] flex items-center justify-between px-6 shrink-0">
        
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-[#28E7A2] uppercase tracking-[0.15em]">
            {code}
          </div>
          <div className="w-[1px] h-4 bg-[#333]" />
          <h1 className="text-white text-sm tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <>
              <div className="w-[1px] h-4 bg-[#333]" />
              <span className="font-mono text-xs text-[#666] uppercase tracking-wider">
                {subtitle}
              </span>
            </>
          )}
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}

      </div>
    );
  }

  return null;
}
