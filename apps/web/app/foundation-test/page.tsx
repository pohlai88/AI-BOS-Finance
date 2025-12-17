/**
 * Foundation Test Page
 * 
 * Pure test of globals-foundation.css + tailwind.config.js
 * NO BIOSKIN components - just raw Tailwind classes.
 * 
 * Route: /foundation-test
 */

export default function FoundationTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Title */}
        <header className="space-y-2">
          <h1 className="text-display text-foreground">Foundation Test</h1>
          <p className="text-body text-muted-foreground">
            This page uses only the foundation CSS and Tailwind. No BIOSKIN components.
          </p>
        </header>

        {/* ============================================ */}
        {/* SECTION: Background Layers */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Background Layers</h2>
          <p className="text-small text-muted-foreground">
            3 surface levels: base → surface → elevated
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-base p-6 rounded-lg border border-border">
              <p className="text-small font-medium text-foreground">Base</p>
              <p className="text-caption text-muted-foreground">bg-base / bg-background</p>
            </div>
            <div className="bg-surface p-6 rounded-lg border border-border">
              <p className="text-small font-medium text-foreground">Surface</p>
              <p className="text-caption text-muted-foreground">bg-surface / bg-card</p>
            </div>
            <div className="bg-elevated p-6 rounded-lg border border-border">
              <p className="text-small font-medium text-foreground">Elevated</p>
              <p className="text-caption text-muted-foreground">bg-elevated / bg-popover</p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Text Hierarchy */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Text Hierarchy</h2>
          <p className="text-small text-muted-foreground">
            3 text levels: primary (93%) → secondary (60%) → muted (40%)
          </p>

          <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
            <div>
              <p className="text-body text-foreground">
                Primary text — This is your main content. It should be easy to read for hours.
              </p>
            </div>
            <div>
              <p className="text-body text-muted-foreground">
                Secondary text — Supporting information, less prominent but still readable.
              </p>
            </div>
            <div>
              <p className="text-body text-text-muted">
                Muted text — Placeholders, disabled states, timestamps.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Typography Scale */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Typography Scale</h2>

          <div className="bg-surface p-6 rounded-lg border border-border space-y-3">
            <p className="text-display text-foreground">Display — 36px</p>
            <p className="text-heading text-foreground">Heading — 24px</p>
            <p className="text-subheading text-foreground">Subheading — 20px</p>
            <p className="text-body text-foreground">Body — 16px (default)</p>
            <p className="text-small text-foreground">Small — 14px</p>
            <p className="text-caption text-foreground">Caption — 12px</p>
            <p className="text-label text-foreground">LABEL — 11px</p>
            <p className="text-micro text-foreground">Micro — 10px</p>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Brand & Status Colors */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Brand & Status Colors</h2>

          <div className="flex flex-wrap gap-3">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-small font-medium hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-small font-medium hover:bg-secondary/80 transition-colors border border-border">
              Secondary Button
            </button>
            <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-small font-medium hover:bg-destructive/90 transition-colors">
              Destructive
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-green-500/20 text-green-400">
              ✓ Success
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-yellow-500/20 text-yellow-400">
              ⚠ Warning
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-red-500/20 text-red-400">
              ✕ Danger
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-blue-500/20 text-blue-400">
              ℹ Info
            </span>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Card Example */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Card Example</h2>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-subheading text-card-foreground mb-2">Payment Details</h3>
            <p className="text-body text-muted-foreground mb-4">
              Invoice #INV-2024-0042 for Acme Corporation
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-caption text-muted-foreground">Amount</p>
                <p className="text-body text-foreground font-medium">$15,000.00</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Due Date</p>
                <p className="text-body text-foreground font-medium">Dec 25, 2024</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Status</p>
                <p className="text-body text-foreground font-medium">Pending Approval</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Currency</p>
                <p className="text-body text-foreground font-medium">USD</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-small font-medium">
                Approve
              </button>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-small font-medium border border-border">
                Review
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Table Example */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Table Example</h2>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-small font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-4 py-3 text-small font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 text-small font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-body text-foreground">Acme Corp</td>
                  <td className="px-4 py-3 text-body text-foreground font-mono">$15,000.00</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-caption bg-yellow-500/20 text-yellow-400">Pending</span>
                  </td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-body text-foreground">GlobalTech Ltd</td>
                  <td className="px-4 py-3 text-body text-foreground font-mono">$8,500.50</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-caption bg-green-500/20 text-green-400">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-body text-foreground">Cloud Services LLC</td>
                  <td className="px-4 py-3 text-body text-foreground font-mono">$3,200.00</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-caption bg-gray-500/20 text-gray-400">Draft</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Form Example */}
        {/* ============================================ */}
        <section className="space-y-4">
          <h2 className="text-heading text-foreground">Form Example</h2>

          <div className="bg-card p-6 rounded-lg border border-border">
            <form className="space-y-4">
              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Vendor Name
                </label>
                <input
                  type="text"
                  placeholder="Enter vendor name..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-foreground mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-small font-medium">
                  Submit Payment
                </button>
                <button type="button" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-small font-medium border border-border">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-16 border-t border-border">
          <p className="text-caption text-muted-foreground text-center">
            Foundation Test Page • globals-foundation.css • tailwind.config.js
          </p>
        </footer>

      </div>
    </div>
  );
}
