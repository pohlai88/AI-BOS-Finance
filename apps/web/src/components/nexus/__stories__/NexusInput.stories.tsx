import type { Meta, StoryObj } from '@storybook/react';
import { NexusInput } from '../NexusInput';
import { Search, Mail, Key, User } from 'lucide-react';

/**
 * # NexusInput
 *
 * The text input for the Forensic Design System.
 *
 * ## Design Principles
 * - **Mono Typography**: JetBrains Mono for input text
 * - **Sharp Corners**: Minimal border-radius (2px)
 * - **Green Focus**: `nexus-green` focus ring
 * - **Label System**: Uppercase, tracked labels with lock icon for readonly
 *
 * ## States
 * - Default: Dark background with subtle border
 * - Focus: Green border and ring
 * - Readonly: Underline style, no background
 * - Disabled: Reduced opacity
 * - Error: Red error message below
 */
const meta: Meta<typeof NexusInput> = {
  title: 'Forensic/NexusInput',
  component: NexusInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The text input for the Forensic Design System. Mono typography, green focus states, label system.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Uppercase label above the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'text',
      description: 'Error message (displays in red below input)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    readOnly: {
      control: 'boolean',
      description: 'Readonly state (underline style)',
    },
    icon: {
      control: false,
      description: 'Optional icon on the right side',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NexusInput>;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  args: {
    placeholder: 'Enter value...',
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  args: {
    label: 'Entity Name',
    placeholder: 'ACME_CORP_001',
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const WithIcon: Story = {
  args: {
    label: 'Search Registry',
    placeholder: 'Search...',
    icon: <Search className="w-4 h-4" />,
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'user@example.com',
    defaultValue: 'invalid-email',
    error: 'Invalid email format',
    icon: <Mail className="w-4 h-4" />,
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    label: 'System ID',
    defaultValue: 'SYS_001_LOCKED',
    disabled: true,
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const ReadOnly: Story = {
  args: {
    label: 'Immutable Hash',
    defaultValue: '0x7f3a8b2c9d1e',
    readOnly: true,
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const FormExample: Story = {
  render: () => (
    <div className="w-[400px] space-y-6 p-6 bg-nexus-matter border border-nexus-structure">
      <div className="border-b border-nexus-structure pb-4 mb-4">
        <span className="text-xs font-mono text-nexus-green uppercase tracking-widest">
          USER_PROFILE
        </span>
      </div>
      <NexusInput label="Username" placeholder="Enter username" icon={<User className="w-4 h-4" />} />
      <NexusInput
        label="Email"
        type="email"
        placeholder="user@domain.com"
        icon={<Mail className="w-4 h-4" />}
      />
      <NexusInput label="API Key" type="password" placeholder="••••••••" icon={<Key className="w-4 h-4" />} />
      <NexusInput label="Organization ID" defaultValue="ORG_NEXUS_001" readOnly />
    </div>
  ),
};

