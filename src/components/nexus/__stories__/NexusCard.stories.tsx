import type { Meta, StoryObj } from '@storybook/react'
import { NexusCard } from '../NexusCard'
import { Settings } from 'lucide-react'

/**
 * # NexusCard
 *
 * The foundational container for the Forensic Design System.
 *
 * ## Design Principles
 * - **Sharp Corners**: 0px border-radius (no rounded corners)
 * - **1px Borders**: `border-nexus-structure` (#1a1a1a)
 * - **Corner Markers**: Decorative 1x1px squares at each corner
 * - **Dark Background**: `bg-nexus-matter` (#111111)
 *
 * ## Usage
 * Use NexusCard to wrap any content that needs visual containment.
 * Never use raw `<div>` with custom borders - always use this component.
 */
const meta: Meta<typeof NexusCard> = {
  title: 'Forensic/NexusCard',
  component: NexusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The foundational container for the Forensic Design System. Sharp corners, 1px borders, corner markers.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'alert'],
      description: 'Visual variant of the card',
    },
    title: {
      control: 'text',
      description: 'Optional header title (renders with green accent bar)',
    },
    action: {
      control: false,
      description: 'Optional ReactNode for top-right action slot',
    },
  },
}

export default meta
type Story = StoryObj<typeof NexusCard>

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-2">
        <p className="text-nexus-signal text-sm">
          This is the default NexusCard.
        </p>
        <p className="text-nexus-noise font-mono text-xs">
          Notice the sharp corners and corner markers.
        </p>
      </div>
    ),
  },
}

export const WithTitle: Story = {
  args: {
    title: 'SYSTEM_STATUS',
    children: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-nexus-noise font-mono text-xs">UPTIME</span>
          <span className="text-nexus-green font-mono text-sm">99.97%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-nexus-noise font-mono text-xs">LATENCY</span>
          <span className="text-nexus-signal font-mono text-sm">12ms</span>
        </div>
      </div>
    ),
  },
}

export const WithTitleAndAction: Story = {
  args: {
    title: 'CONFIGURATION',
    action: (
      <button className="text-nexus-noise hover:text-nexus-green p-1 transition-colors">
        <Settings className="h-4 w-4" />
      </button>
    ),
    children: (
      <div className="text-nexus-noise font-mono text-xs">
        The action slot accepts any ReactNode for custom controls.
      </div>
    ),
  },
}

export const GlassVariant: Story = {
  args: {
    variant: 'glass',
    title: 'GLASS_PANEL',
    children: (
      <div className="text-nexus-signal text-sm">
        Glass variant with backdrop blur. Use for overlays and modals.
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'nexus-matter' },
  },
}

export const AlertVariant: Story = {
  args: {
    variant: 'alert',
    title: 'CRITICAL_WARNING',
    children: (
      <div className="space-y-2">
        <p className="font-mono text-sm text-red-400">
          SYSTEM INTEGRITY COMPROMISED
        </p>
        <p className="text-nexus-noise text-xs">Immediate action required.</p>
      </div>
    ),
  },
}

export const DataGrid: Story = {
  render: () => (
    <div className="grid w-[600px] grid-cols-2 gap-4">
      <NexusCard title="INGEST_RATE">
        <div className="text-nexus-signal text-2xl font-medium">1,248</div>
        <div className="text-nexus-noise font-mono text-xs">records/sec</div>
      </NexusCard>
      <NexusCard title="VALIDATION">
        <div className="text-nexus-green text-2xl font-medium">99.2%</div>
        <div className="text-nexus-noise font-mono text-xs">pass rate</div>
      </NexusCard>
      <NexusCard title="QUEUE_DEPTH">
        <div className="text-nexus-signal text-2xl font-medium">342</div>
        <div className="text-nexus-noise font-mono text-xs">pending</div>
      </NexusCard>
      <NexusCard variant="alert" title="ERRORS">
        <div className="text-2xl font-medium text-red-400">7</div>
        <div className="text-nexus-noise font-mono text-xs">last 24h</div>
      </NexusCard>
    </div>
  ),
}
