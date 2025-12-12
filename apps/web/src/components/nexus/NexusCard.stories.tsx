import type { Meta, StoryObj } from '@storybook/react';
import { NexusCard } from './NexusCard';
import { ShieldCheck } from 'lucide-react';
import { NexusButton } from './NexusButton';

// 1. Define the Component Metadata
const meta = {
  title: 'Forensic/Atoms/NexusCard', // 🗂 Organized folder structure
  component: NexusCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'], // Auto-generates documentation page
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'alert'],
    },
  },
} satisfies Meta<typeof NexusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 2. The "Default" Contract
export const Default: Story = {
  args: {
    title: 'SYSTEM_STATUS',
    children: (
      <div className="space-y-2">
        <div className="text-2xl text-white font-mono tracking-tighter">OPERATIONAL</div>
        <div className="text-xs text-nexus-noise font-mono">Uptime: 99.99%</div>
      </div>
    ),
    variant: 'default',
  },
};

// 3. The "Glass" Variant (Used in Landing Page)
export const GlassPanel: Story = {
  args: {
    title: 'STABILITY_SIMULATION',
    variant: 'glass',
    children: (
      <div className="p-4 text-nexus-green font-mono text-xs">
        // Glass effect active. Background blurred.
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'nexus-matter' }, // Easier to see glass on gray
  },
};

// 4. The "Alert" Variant (Used for critical failures)
export const AlertState: Story = {
  args: {
    title: 'SECURITY_BREACH',
    variant: 'alert',
    children: (
      <div className="flex items-center gap-4 text-red-500">
        <ShieldCheck className="w-8 h-8" />
        <div>
          <div className="font-bold">UNAUTHORIZED ACCESS</div>
          <div className="text-xs opacity-80">IP: 192.168.1.X</div>
        </div>
      </div>
    ),
  },
};

// 5. Complex Composition (Action Button Header)
export const WithActionHeader: Story = {
  args: {
    title: 'ACTIVITY_LOG',
    action: (
      <NexusButton variant="secondary" className="h-6 text-[10px] px-2">
        EXPORT CSV
      </NexusButton>
    ),
    children: (
      <div className="text-nexus-noise text-xs font-mono">&gt; No recent activity detected.</div>
    ),
  },
};

