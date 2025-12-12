// ============================================================================
// BIO DEMO PAGE - The Living Skin Showcase
// ============================================================================
// Demonstrates Generative UI: UI that grows from Zod schemas
// This page proves the "Biological Monorepo" vision in action
// ============================================================================

import { ZodBioDemo } from '@aibos/bioskin'
import { Surface, Txt } from '@aibos/ui'

export default function BioDemoPage() {
  return (
    <div className="min-h-screen bg-surface-base p-8">
      <header className="mx-auto mb-8 max-w-7xl">
        <Surface variant="base" className="mb-6 p-6">
          <Txt variant="h1" className="mb-2">
            🧬 Biological UI Demo
          </Txt>
          <Txt variant="body" className="text-text-secondary">
            This UI is <strong>not hardcoded</strong>. It is grown directly from
            Zod Schemas. Mutate the DNA (Schema), and the Skin (UI) adapts
            instantly.
          </Txt>
        </Surface>
      </header>
      <div className="mx-auto max-w-7xl">
        <ZodBioDemo />
      </div>
    </div>
  )
}
