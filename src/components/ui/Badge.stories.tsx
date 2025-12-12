import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

/**
 * 🛡️ THE CONTROL PLANE - Status Governance
 * 
 * This Storybook story acts as the "Contract" for the Badge component.
 * 
 * Governance Workflow:
 * 1. Developer creates/updates Badge.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match the design spec?"
 * 4. Only then is it merged into the App
 * 
 * This prevents "hardcoded green dot" drift by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge', // Organized hierarchy: Atoms → Molecules → Organisms
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Badge Component - Status Enforcement Layer**

The Badge component prevents "hardcoded green dot" drift by enforcing
the status system. Developers CANNOT use arbitrary colors like \`bg-emerald-500\`.

**Governance Rules:**
- ✅ Only 4 variants allowed: success, warning, error, neutral
- ✅ Only 3 sizes allowed: sm, md, lg
- ✅ Two modes: badge (with text) or dot (indicator only)
- ✅ Uses governed colors (status-success/warning/error/neutral)
- ✅ Semantic meaning (variant defines intent)

**Changing tokens in globals.css updates ALL badges automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'neutral'],
      description: 'Status variant - defines intent (good, caution, problem, info)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size - defines visual prominence',
    },
    mode: {
      control: 'select',
      options: ['badge', 'dot'],
      description: 'Display mode - badge (with text) or dot (indicator only)',
    },
    children: {
      control: 'text',
      description: 'Badge content (only used in badge mode)',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

/**
 * 🧪 TEST CASE 1: Status Variants (Badge Mode)
 * 
 * All four status variants as full badges.
 */
export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Badge variant="success" mode="badge">Operational</Badge>
      <Badge variant="warning" mode="badge">Warning</Badge>
      <Badge variant="error" mode="badge">Error</Badge>
      <Badge variant="neutral" mode="badge">Info</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All status variants as full badges with text.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 2: Status Dots
 * 
 * Status indicator dots (replaces hardcoded green dots).
 */
export const StatusDots: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="success" mode="dot" />
        <span>Operational</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning" mode="dot" />
        <span>Warning</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error" mode="dot" />
        <span>Error</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="neutral" mode="dot" />
        <span>Info</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status indicator dots - replaces hardcoded colored dots.',
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Badge variant="success" size="sm">Small</Badge>
        <Badge variant="success" size="md">Medium</Badge>
        <Badge variant="success" size="lg">Large</Badge>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="success" mode="dot" size="sm" />
        <Badge variant="success" mode="dot" size="md" />
        <Badge variant="success" mode="dot" size="lg" />
      </div>
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
 * 🧪 TEST CASE 4: Real-World Usage
 * 
 * How badges are used in actual UI (like the dashboard).
 */
export const RealWorldUsage: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold">System Status</span>
        <Badge variant="success" mode="dot" />
        <Badge variant="success" mode="badge" size="sm">Operational</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Active Nodes</span>
        <Badge variant="neutral" mode="dot" />
        <Badge variant="neutral" mode="badge" size="sm">24/24</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Uptime</span>
        <Badge variant="success" mode="dot" />
        <Badge variant="success" mode="badge" size="sm">99.9%</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Alert</span>
        <Badge variant="warning" mode="dot" />
        <Badge variant="warning" mode="badge" size="sm">Attention Required</Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage example - how badges replace hardcoded status dots.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 5: All Variants Comparison
 * 
 * Side-by-side comparison of all variants and modes.
 * This is the "Visual Audit" - see all badge styles in one place.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-semibold">Badge Mode</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" mode="badge">Success</Badge>
          <Badge variant="warning" mode="badge">Warning</Badge>
          <Badge variant="error" mode="badge">Error</Badge>
          <Badge variant="neutral" mode="badge">Neutral</Badge>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Dot Mode</h3>
        <div className="flex items-center gap-4">
          <Badge variant="success" mode="dot" />
          <Badge variant="warning" mode="dot" />
          <Badge variant="error" mode="dot" />
          <Badge variant="neutral" mode="dot" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all Badge variants and modes for visual audit.',
      },
    },
  },
}
