import type { Meta, StoryObj } from '@storybook/react';
import { NexusButton } from './NexusButton';
import { ArrowRight, Download, RefreshCw } from 'lucide-react';

const meta = {
  title: 'Forensic/Atoms/NexusButton',
  component: NexusButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof NexusButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'INITIALIZE PROTOCOL',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'VIEW DOCUMENTATION',
    variant: 'secondary',
    icon: <ArrowRight className="w-4 h-4" />,
  },
};

export const DangerZone: Story = {
  args: {
    children: 'TERMINATE PROCESS',
    variant: 'danger',
    icon: <RefreshCw className="w-4 h-4" />,
  },
};

export const LoadingState: Story = {
  args: {
    children: 'SYNCING...',
    variant: 'secondary',
    disabled: true,
    icon: <Download className="w-4 h-4 animate-bounce" />,
  },
};

