import type { Meta, StoryObj } from '@storybook/react'
import { Btn } from './Btn'

/**
 * 🛡️ THE CONTROL PLANE - Action Governance
 * 
 * This Storybook story acts as the "Contract" for the Btn component.
 * 
 * Governance Workflow:
 * 1. Developer creates/updates Btn.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match the design spec?"
 * 4. Only then is it merged into the App
 * 
 * This prevents "Fake Button" drift by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof Btn> = {
  title: 'Atoms/Btn', // Organized hierarchy: Atoms → Molecules → Organisms
  component: Btn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Btn Component - Action Enforcement Layer**

The Btn component is the "Action Atom" that prevents "Fake Button" drift.
It ENFORCES the action system by preventing developers from using Surface
as a button or creating arbitrary button styles.

**Governance Rules:**
- ✅ Only 2 variants allowed: primary, secondary
- ✅ Only 3 sizes allowed: sm, md, lg
- ✅ Uses governed colors (action-primary/secondary)
- ✅ Semantic HTML (<button> tag)
- ✅ Keyboard accessible (Tab, Enter, Space)
- ✅ Focus states (visible focus ring)
- ✅ Disabled states (opacity + pointer-events)
- ✅ Loading states (spinner + disabled)

**Changing tokens in globals.css updates ALL buttons automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Button variant - defines visual intent (main action vs alternative)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size - defines touch target and padding',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state - shows spinner and disables interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state - prevents interaction',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
}

export default meta
type Story = StoryObj<typeof Btn>

/**
 * 🧪 TEST CASE 1: Primary Actions
 * 
 * Main actions use brand green (high contrast, prominent).
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Export Report',
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary button variant - main actions use brand green.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 2: Secondary Actions
 * 
 * Alternative actions use outlined style (subtle, less prominent).
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary button variant - alternative actions use outlined style.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 3: Size Variants
 * 
 * All three size variants for different use cases.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Btn variant="primary" size="sm">Small</Btn>
      <Btn variant="primary" size="md">Medium</Btn>
      <Btn variant="primary" size="lg">Large</Btn>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All size variants: sm (compact), md (default), lg (prominent).',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 4: Loading State
 * 
 * Loading state shows spinner and disables interaction.
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Processing...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner - button is disabled during loading.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 5: Disabled State
 * 
 * Disabled state prevents interaction.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Btn variant="primary" disabled>Disabled Primary</Btn>
      <Btn variant="secondary" disabled>Disabled Secondary</Btn>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - buttons are non-interactive with reduced opacity.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 6: All Variants Comparison
 * 
 * Side-by-side comparison of all variants.
 * This is the "Visual Audit" - see all button styles in one place.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Btn variant="primary">Primary</Btn>
        <Btn variant="secondary">Secondary</Btn>
      </div>
      <div className="flex items-center gap-4">
        <Btn variant="primary" size="sm">Primary Small</Btn>
        <Btn variant="secondary" size="sm">Secondary Small</Btn>
      </div>
      <div className="flex items-center gap-4">
        <Btn variant="primary" loading>Loading</Btn>
        <Btn variant="primary" disabled>Disabled</Btn>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all Btn variants for visual audit.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 7: Keyboard Accessibility
 * 
 * Verify buttons are keyboard accessible (Tab, Enter, Space).
 * This is tested manually - buttons should:
 * - Receive focus on Tab
 * - Activate on Enter/Space
 * - Show visible focus ring
 */
export const KeyboardAccessible: Story = {
  args: {
    variant: 'primary',
    children: 'Tab to focus, Enter/Space to activate',
  },
  parameters: {
    docs: {
      description: {
        story: 'Keyboard accessibility test - Tab to focus, Enter/Space to activate. Focus ring should be visible.',
      },
    },
  },
}
