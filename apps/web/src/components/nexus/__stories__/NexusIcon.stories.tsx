import type { Meta, StoryObj } from '@storybook/react';
import { NexusIcon } from '../NexusIcon';

const meta = {
  title: 'Forensic/Brand/NexusIcon',
  component: NexusIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The official NexusCanon brand icon. A crystal diamond with rotating ring and pulsing center. This is the SINGLE SOURCE OF TRUTH for the brand icon across all components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the icon',
    },
    animated: {
      control: 'boolean',
      description: 'Enable/disable animations',
    },
  },
} satisfies Meta<typeof NexusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default animated icon
export const Default: Story = {
  args: {
    size: 'md',
    animated: true,
  },
};

// Size variants
export const Small: Story = {
  args: {
    size: 'sm',
    animated: true,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    animated: true,
  },
};

// Static version (for performance-sensitive contexts)
export const Static: Story = {
  args: {
    size: 'md',
    animated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use this variant in lists or grids where many icons are rendered.',
      },
    },
  },
};

// All sizes comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <NexusIcon size="sm" />
        <span className="text-[10px] font-mono text-nexus-noise">SM (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NexusIcon size="md" />
        <span className="text-[10px] font-mono text-nexus-noise">MD (28px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NexusIcon size="lg" />
        <span className="text-[10px] font-mono text-nexus-noise">LG (40px)</span>
      </div>
    </div>
  ),
};

// Brand lockup (icon + wordmark)
export const BrandLockup: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <NexusIcon size="md" />
      <span className="text-base tracking-tight text-white font-medium">NexusCanon</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The standard brand lockup used in headers and navigation.',
      },
    },
  },
};

