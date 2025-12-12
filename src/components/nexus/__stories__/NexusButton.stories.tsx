import type { Meta, StoryObj } from '@storybook/react'
import { NexusButton } from '../NexusButton'
import { Download, RefreshCw, Trash2, ArrowRight, Settings } from 'lucide-react'

/**
 * # NexusButton
 *
 * The action trigger for the Forensic Design System.
 *
 * ## Design Principles
 * - **Mono Typography**: JetBrains Mono, uppercase, wide tracking
 * - **Sharp Corners**: 0px border-radius
 * - **Green Flash**: Primary variant uses `nexus-green`
 * - **Corner Animations**: Secondary variant has hover micro-interactions
 *
 * ## Variants
 * - `primary`: Solid green background (main CTA)
 * - `secondary`: Wireframe with hover effects (secondary actions)
 * - `danger`: Red tinted for destructive actions
 * - `ghost`: Minimal styling (not implemented yet)
 */
const meta: Meta<typeof NexusButton> = {
  title: 'Forensic/NexusButton',
  component: NexusButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The action trigger for the Forensic Design System. Mono typography, sharp corners, hover micro-interactions.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual variant of the button',
    },
    icon: {
      control: false,
      description: 'Optional icon (ReactNode) displayed before text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
}

export default meta
type Story = StoryObj<typeof NexusButton>

// ============================================================================
// STORIES
// ============================================================================

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'INITIALIZE',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'CONFIGURE',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'TERMINATE',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <Download className="h-3 w-3" />,
    children: 'EXPORT',
  },
}

export const SecondaryWithIcon: Story = {
  args: {
    variant: 'secondary',
    icon: <RefreshCw className="h-3 w-3" />,
    children: 'SYNC',
  },
}

export const DangerWithIcon: Story = {
  args: {
    variant: 'danger',
    icon: <Trash2 className="h-3 w-3" />,
    children: 'DELETE',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'PROCESSING...',
    disabled: true,
  },
}

export const ButtonGroup: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <NexusButton variant="secondary" icon={<Settings className="h-3 w-3" />}>
        SETTINGS
      </NexusButton>
      <NexusButton variant="primary" icon={<ArrowRight className="h-3 w-3" />}>
        PROCEED
      </NexusButton>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <NexusButton variant="primary">PRIMARY</NexusButton>
        <NexusButton variant="secondary">SECONDARY</NexusButton>
        <NexusButton variant="danger">DANGER</NexusButton>
      </div>
      <div className="flex items-center gap-4">
        <NexusButton variant="primary" icon={<Download className="h-3 w-3" />}>
          WITH ICON
        </NexusButton>
        <NexusButton
          variant="secondary"
          icon={<RefreshCw className="h-3 w-3" />}
        >
          WITH ICON
        </NexusButton>
        <NexusButton variant="danger" icon={<Trash2 className="h-3 w-3" />}>
          WITH ICON
        </NexusButton>
      </div>
      <div className="flex items-center gap-4">
        <NexusButton variant="primary" disabled>
          DISABLED
        </NexusButton>
        <NexusButton variant="secondary" disabled>
          DISABLED
        </NexusButton>
        <NexusButton variant="danger" disabled>
          DISABLED
        </NexusButton>
      </div>
    </div>
  ),
}
