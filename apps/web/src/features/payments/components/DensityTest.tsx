/**
 * Density Test Component
 * 
 * Tests the new Supabase-style height variables for ERP data tables
 * Usage: <DensityTest />
 */

export function DensityTest() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold mb-4">Component Height Density Test</h2>

      {/* Tiny - Compact tags/badges */}
      <div
        style={{ height: 'var(--height-tiny)' }}
        className="bg-card flex items-center px-4 rounded-md"
      >
        <span className="text-sm">Tiny (26px) - Compact Mode</span>
      </div>

      {/* Small - Dense table rows */}
      <div
        style={{ height: 'var(--height-small)' }}
        className="bg-card flex items-center px-4 rounded-md"
      >
        <span className="text-sm">Small (34px) - Dense Tables</span>
      </div>

      {/* Medium - Default inputs */}
      <div
        style={{ height: 'var(--height-medium)' }}
        className="bg-card flex items-center px-4 rounded-md"
      >
        <span className="text-sm">Medium (38px) - Default</span>
      </div>

      {/* Large - Touch targets */}
      <div
        style={{ height: 'var(--height-large)' }}
        className="bg-card flex items-center px-4 rounded-md"
      >
        <span className="text-sm">Large (42px) - Touch Friendly</span>
      </div>

      {/* XLarge - Hero inputs */}
      <div
        style={{ height: 'var(--height-xlarge)' }}
        className="bg-card flex items-center px-4 rounded-md"
      >
        <span className="text-sm">XLarge (50px) - Hero CTAs</span>
      </div>

      {/* Data Table Row Height */}
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Data Table Row Height</h3>
        <div
          style={{ height: 'var(--datatable-row-height)' }}
          className="bg-muted flex items-center px-4 rounded-md"
        >
          <span className="text-xs">Table Row (28px) - Optimal for dense data</span>
        </div>
      </div>

      {/* Using Tailwind Classes (if configured) */}
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Using Tailwind Classes</h3>
        <div className="h-height-small bg-card flex items-center px-4 rounded-md">
          <span className="text-sm">h-height-small (34px)</span>
        </div>
      </div>
    </div>
  );
}
