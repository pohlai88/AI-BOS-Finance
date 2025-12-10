import type { Meta, StoryObj } from '@storybook/react';
import { NexusCard } from '../NexusCard';
import { Settings } from 'lucide-react';

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
};

export default meta;
type Story = StoryObj<typeof NexusCard>;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-2">
        <p className="text-nexus-signal text-sm">This is the default NexusCard.</p>
        <p className="text-nexus-noise text-xs font-mono">
          Notice the sharp corners and corner markers.
        </p>
      </div>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    title: 'SYSTEM_STATUS',
    children: (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-nexus-noise text-xs font-mono">UPTIME</span>
          <span className="text-nexus-green text-sm font-mono">99.97%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-nexus-noise text-xs font-mono">LATENCY</span>
          <span className="text-nexus-signal text-sm font-mono">12ms</span>
        </div>
      </div>
    ),
  },
};

export const WithTitleAndAction: Story = {
  args: {
    title: 'CONFIGURATION',
    action: (
      <button className="p-1 text-nexus-noise hover:text-nexus-green transition-colors">
        <Settings className="w-4 h-4" />
      </button>
    ),
    children: (
      <div className="text-nexus-noise text-xs font-mono">
        The action slot accepts any ReactNode for custom controls.
      </div>
    ),
  },
};

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
};

export const AlertVariant: Story = {
  args: {
    variant: 'alert',
    title: 'CRITICAL_WARNING',
    children: (
      <div className="space-y-2">
        <p className="text-red-400 text-sm font-mono">SYSTEM INTEGRITY COMPROMISED</p>
        <p className="text-nexus-noise text-xs">Immediate action required.</p>
      </div>
    ),
  },
};

export const DataGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <NexusCard title="INGEST_RATE">
        <div className="text-2xl text-nexus-signal font-medium">1,248</div>
        <div className="text-xs text-nexus-noise font-mono">records/sec</div>
      </NexusCard>
      <NexusCard title="VALIDATION">
        <div className="text-2xl text-nexus-green font-medium">99.2%</div>
        <div className="text-xs text-nexus-noise font-mono">pass rate</div>
      </NexusCard>
      <NexusCard title="QUEUE_DEPTH">
        <div className="text-2xl text-nexus-signal font-medium">342</div>
        <div className="text-xs text-nexus-noise font-mono">pending</div>
      </NexusCard>
      <NexusCard variant="alert" title="ERRORS">
        <div className="text-2xl text-red-400 font-medium">7</div>
        <div className="text-xs text-nexus-noise font-mono">last 24h</div>
      </NexusCard>
    </div>
  ),
};

