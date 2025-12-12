// ============================================================================
// REG APP SHELL - "The Engine Room"
// Authentication system container with split-screen layout
// Left: Control Panel (Form) | Right: Mechanical Orchestra (Visualization)
// Per Guidelines.md: Forensic aesthetic, no SaaS blob, engineered precision
// ============================================================================

import { ReactNode } from 'react'
import { MechanicalOrchestra } from '../auth/MechanicalOrchestra'

interface RegAppShellProps {
  children: ReactNode
  showOrchestra?: boolean // Toggle the right panel visualization
}

export const RegAppShell = ({
  children,
  showOrchestra = true,
}: RegAppShellProps) => {
  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        backgroundColor: '#000000', // The Void
        color: 'var(--prism-signal)',
      }}
    >
      {/* LEFT PANEL - The Control Panel */}
      <div
        className="relative flex flex-1 items-center justify-center"
        style={{
          backgroundColor: '#000000',
          borderRight: showOrchestra
            ? '1px solid var(--prism-structure-primary)'
            : 'none',
        }}
      >
        {/* Form Content (Outlet) */}
        <div className="w-full max-w-md px-8">{children}</div>
      </div>

      {/* RIGHT PANEL - The Mechanical Orchestra */}
      {showOrchestra && (
        <div
          className="relative flex-1 overflow-hidden"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Orchestra Visualization */}
          <MechanicalOrchestra />
        </div>
      )}
    </div>
  )
}
