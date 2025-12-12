import type { Meta, StoryObj } from '@storybook/react'
import { Surface } from './Surface'

/**
 * 🛡️ THE CONTROL PLANE
 *
 * This Storybook story acts as the "Contract" for the Surface component.
 *
 * Governance Workflow:
 * 1. Developer creates/updates Surface.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match the design spec?"
 * 4. Only then is it merged into the App
 *
 * This prevents "Component Drift" by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof Surface> = {
  title: 'Atoms/Surface', // Organized hierarchy: Atoms → Molecules → Organisms
  component: Surface,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Surface Component - The Atomic Building Block**

The Surface component is the foundation of all card/panel UI elements.
It OBEYS the tokens defined in \`globals.css\` (The Constitution).

**Governance Rules:**
- ✅ Uses CSS variables (--surface-*) for all colors
- ✅ Locked border radius (--surface-radius)
- ✅ No hardcoded colors allowed
- ✅ Variants define intent, not appearance

**Changing tokens in globals.css updates ALL Surfaces automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    variant: {
      control: 'select',
      options: ['base', 'flat', 'ghost'],
      description:
        'Surface variant - defines visual intent (elevated, subtle, transparent)',
    },
    children: {
      control: false,
      description: 'Content to render inside the surface',
    },
  },
}

export default meta
type Story = StoryObj<typeof Surface>

/**
 * 🧪 TEST CASE 1: Base Card
 *
 * The standard elevated card surface.
 * Used for: Cards, modals, popovers, elevated content
 */
export const BaseCard: Story = {
  args: {
    variant: 'base',
    children: (
      <div className="p-6 text-[var(--color-text-primary)]">
        <h3 className="mb-2 text-heading font-semibold">Base Surface</h3>
        <p className="text-body text-[var(--color-text-secondary)]">
          This is a standard card surface with elevation and border. Background:
          var(--surface-base-bg)
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard elevated card surface. Used for primary content containers.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 2: Flat Panel
 *
 * Subtle panel surface without elevation.
 * Used for: Sidebars, nested panels, subtle backgrounds
 */
export const FlatPanel: Story = {
  args: {
    variant: 'flat',
    children: (
      <div className="p-6 text-[var(--color-text-primary)]">
        <h3 className="mb-2 text-heading font-semibold">Flat Surface</h3>
        <p className="text-body text-[var(--color-text-secondary)]">
          This is a flat panel surface without elevation. Background:
          var(--surface-flat-bg)
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Subtle panel surface without elevation. Used for nested content or sidebars.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 3: Ghost Surface
 *
 * Transparent surface with no background.
 * Used for: Wrappers, containers that need no visual treatment
 */
export const GhostSurface: Story = {
  args: {
    variant: 'ghost',
    children: (
      <div className="p-6 text-[var(--color-text-primary)]">
        <h3 className="mb-2 text-heading font-semibold">Ghost Surface</h3>
        <p className="text-body text-[var(--color-text-secondary)]">
          This is a transparent surface with no background or border. Used for
          layout containers.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Transparent surface with no visual treatment. Used for layout containers.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 4: Stress Test - Long Content
 *
 * Verify Surface handles long content gracefully.
 * This prevents production bugs from content overflow.
 */
export const LongContent: Story = {
  args: {
    variant: 'base',
    children: (
      <div className="max-w-md p-6 text-[var(--color-text-primary)]">
        <h3 className="mb-2 text-heading font-semibold">
          Stress Test: Long Content
        </h3>
        <p className="text-body text-[var(--color-text-secondary)]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </p>
        <p className="mt-4 text-body text-[var(--color-text-secondary)]">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
          officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde
          omnis iste natus error sit voluptatem accusantium doloremque
          laudantium.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress test with long content to verify proper wrapping and spacing.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 5: Interactive States
 *
 * Verify Surface works with hover/focus states.
 */
export const Interactive: Story = {
  args: {
    variant: 'base',
    className: 'cursor-pointer hover:opacity-90 transition-opacity',
    children: (
      <div className="p-6 text-[var(--color-text-primary)]">
        <h3 className="mb-2 text-heading font-semibold">Interactive Surface</h3>
        <p className="text-body text-[var(--color-text-secondary)]">
          Hover over this surface to see the interaction state.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Surface with interactive states (hover, focus).',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 6: All Variants Comparison
 *
 * Side-by-side comparison of all variants.
 * This is the "Visual Audit" - see all UI elements in one place.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Surface variant="base" className="p-4">
        <div className="text-[var(--color-text-primary)]">
          <strong>Base:</strong> Elevated card
        </div>
      </Surface>
      <Surface variant="flat" className="p-4">
        <div className="text-[var(--color-text-primary)]">
          <strong>Flat:</strong> Subtle panel
        </div>
      </Surface>
      <Surface
        variant="ghost"
        className="border border-[var(--color-border-default)] p-4"
      >
        <div className="text-[var(--color-text-primary)]">
          <strong>Ghost:</strong> Transparent (border shown for visibility)
        </div>
      </Surface>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison of all Surface variants for visual audit.',
      },
    },
  },
}
